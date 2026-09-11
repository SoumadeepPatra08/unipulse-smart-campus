#!/usr/bin/env python3
"""
UniPulse Production Server
Combines static asset delivery (SPA, bundle, custom styles, uploads)
with a full-featured REST API, Server-Sent Events (SSE) realtime channel,
and automated SQLite database initialization & seeding.
"""

import http.server
import socketserver
import os
import sys
import json
import re
import urllib.parse
import queue
import time
import uuid

# Ensure project root is in python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.db import init_db, get_db_connection
from backend.routes import (
    REALTIME_CLIENTS, handle_login, handle_register, handle_logout, handle_get_me, handle_search,
    handle_assistant_message, record_assistant_exchange, get_auth_user,
    handle_get_items, handle_create_item,
    handle_get_item_matches, handle_claim_match, handle_get_locations,
    handle_get_route, handle_get_study_spaces, handle_reserve_study_space,
    handle_admin_kpis, handle_admin_audit_queue, handle_admin_verify,
    handle_get_events, handle_rsvp_event, handle_get_profile,
    handle_update_interests, handle_update_profile, handle_upload_avatar,
    success_response, error_response
)
from backend.assistant import stream_assistant_chunks
import seed

PORT = 8080

def ensure_database_ready():
    """Initializes and seeds the database if empty."""
    init_db()
    conn = get_db_connection()
    user_count = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
    conn.close()
    if user_count == 0:
        print("[UniPulse Server] Database empty. Running seed...")
        seed.seed_database()

class UniPulseRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def handle(self):
        try:
            super().handle()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            raw_data = self.rfile.read(content_length).decode('utf-8')
            try:
                return json.loads(raw_data)
            except Exception:
                return {}
        return {}

    def send_json(self, data, status=200, cookies=None):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        if cookies:
            for cookie in cookies:
                self.send_header('Set-Cookie', cookie)
        self.end_headers()
        self.wfile.write(body)

    # -------------------------------------------------------------------------
    # REST API Request Dispatcher
    # -------------------------------------------------------------------------
    def dispatch_api_get(self, path, query_params):
        # Strip /api prefix if present
        clean_path = path[4:] if path.startswith("/api") else path

        # Auth
        if clean_path == "/auth/me":
            res = handle_get_me(self.headers)
            return self.send_json(res, 200 if not res["error"] else 401)

        # Search (Hero + ⌘K)
        if clean_path == "/search":
            q = query_params.get("q", [""])[0]
            return self.send_json(handle_search(q))

        # Locations
        if clean_path == "/locations":
            return self.send_json(handle_get_locations())

        # Route walking directions
        if clean_path == "/route":
            f = query_params.get("from", ["b34"])[0]
            t = query_params.get("to", ["sport"])[0]
            return self.send_json(handle_get_route(f, t))

        # Study Spaces
        if clean_path == "/study-spaces":
            return self.send_json(handle_get_study_spaces())

        # Lost & Found Items
        if clean_path == "/items":
            return self.send_json(handle_get_items(query_params))

        # Match detail (e.g. /api/items/:id/matches or /api/matches/:id)
        match_item = re.match(r"^/items/([^/]+)/matches$", clean_path)
        if match_item:
            return self.send_json(handle_get_item_matches(match_item.group(1)))

        match_single = re.match(r"^/matches/([^/]+)$", clean_path)
        if match_single:
            return self.send_json(handle_get_item_matches(match_single.group(1)))

        # Events
        if clean_path == "/events":
            return self.send_json(handle_get_events())

        # Profile
        if clean_path == "/profile":
            return self.send_json(handle_get_profile(self.headers))

        # Admin
        if clean_path == "/admin/kpis":
            return self.send_json(handle_admin_kpis())

        if clean_path == "/admin/audit-queue":
            return self.send_json(handle_admin_audit_queue())

        return None

    def dispatch_api_post(self, path, body):
        clean_path = path[4:] if path.startswith("/api") else path

        # Auth: Register
        if clean_path == "/auth/register":
            res = handle_register(body)
            status_code = res.get("meta", {}).get("status_code", 201) if not res.get("error") else res["error"]["code"]
            cookies = []
            if not res.get("error") and res.get("data", {}).get("token"):
                token = res["data"]["token"]
                cookie = f"token={token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800"
                cookies.append(cookie)
            return self.send_json(res, status_code, cookies=cookies)

        # Auth: Login
        if clean_path == "/auth/login":
            res = handle_login(body)
            status_code = 200 if not res.get("error") else res["error"]["code"]
            cookies = []
            if not res.get("error") and res.get("data", {}).get("token"):
                token = res["data"]["token"]
                cookie = f"token={token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800"
                cookies.append(cookie)
            return self.send_json(res, status_code, cookies=cookies)

        # Auth: Logout
        if clean_path == "/auth/logout":
            res = handle_logout()
            clear_cookie = "token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
            return self.send_json(res, 200, cookies=[clear_cookie])

        # AI Campus Assistant
        if clean_path in ("/assistant/message", "/assistant/query"):
            is_stream = body.get("stream", False) or "stream=true" in self.path or "text/event-stream" in self.headers.get("Accept", "")
            if is_stream:
                self.send_response(200)
                self.send_header('Content-Type', 'text/event-stream')
                self.send_header('Cache-Control', 'no-cache')
                self.send_header('Connection', 'keep-alive')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()

                auth_user = get_auth_user(self.headers)
                user_id = auth_user["sub"] if auth_user else "user-alex"
                msg = (body.get("message") or "").strip()
                session_id = body.get("session_id") or str(uuid.uuid4())

                final_content = ""
                final_cards = []
                try:
                    for chunk in stream_assistant_chunks(msg, user_id):
                        if chunk.get("type") == "complete":
                            final_content = chunk.get("content", "")
                            final_cards = chunk.get("cards", [])
                        chunk_json = json.dumps(chunk)
                        self.wfile.write(f"data: {chunk_json}\n\n".encode('utf-8'))
                        self.wfile.flush()
                except (ConnectionResetError, BrokenPipeError):
                    pass
                finally:
                    if final_content:
                        record_assistant_exchange(session_id, user_id, msg, final_content, final_cards)
                return True
            return self.send_json(handle_assistant_message(body, self.headers))

        # Create Lost / Found Item
        if clean_path == "/items":
            return self.send_json(handle_create_item(body, self.headers), 201)

        # Claim Match
        match_claim = re.match(r"^/matches/([^/]+)/claim$", clean_path)
        if match_claim:
            return self.send_json(handle_claim_match(match_claim.group(1), self.headers))

        # Study Space Reservation
        match_reserve = re.match(r"^/study-spaces/([^/]+)/reserve$", clean_path)
        if match_reserve:
            return self.send_json(handle_reserve_study_space(match_reserve.group(1), body, self.headers), 201)

        # Event RSVP
        match_rsvp = re.match(r"^/events/([^/]+)/rsvp$", clean_path)
        if match_rsvp:
            return self.send_json(handle_rsvp_event(match_rsvp.group(1), self.headers))

        # Admin Match Verification
        match_verify = re.match(r"^/admin/audit/([^/]+)/verify$", clean_path)
        if match_verify:
            return self.send_json(handle_admin_verify(match_verify.group(1), body, self.headers))

        # Profile avatar upload
        if clean_path in ("/profile/avatar", "/user/avatar"):
            return self.send_json(handle_upload_avatar(body, self.headers))

        # File upload simulation
        if clean_path == "/upload":
            img_data = body.get("image_base64", "")
            filename = f"upload_{uuid.uuid4().hex[:8]}.jpg"
            file_path = os.path.join(BASE_DIR, "uploads", filename)
            if img_data and "," in img_data:
                import base64
                header, encoded = img_data.split(",", 1)
                with open(file_path, "wb") as f:
                    f.write(base64.b64decode(encoded))
                return self.send_json(success_response({"url": f"/uploads/{filename}"}))
            return self.send_json(success_response({"url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80"}))

        return None

    # -------------------------------------------------------------------------
    # HTTP Method Overrides
    # -------------------------------------------------------------------------
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query_params = urllib.parse.parse_qs(parsed.query)

        # Realtime Server-Sent Events (SSE) stream for Study Spaces
        if path in ("/api/realtime/study-spaces", "/realtime/study-spaces"):
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            client_q = queue.Queue()
            REALTIME_CLIENTS.append(client_q)
            # Welcome message
            self.wfile.write(b"data: {\"type\": \"connected\"}\n\n")
            self.wfile.flush()

            try:
                while True:
                    try:
                        msg = client_q.get(timeout=20.0)
                        self.wfile.write(msg.encode('utf-8'))
                        self.wfile.flush()
                    except queue.Empty:
                        # Keep-alive heartbeat comment
                        self.wfile.write(b": ping\n\n")
                        self.wfile.flush()
            except (ConnectionResetError, BrokenPipeError):
                pass
            finally:
                if client_q in REALTIME_CLIENTS:
                    REALTIME_CLIENTS.remove(client_q)
            return

        # Check API routes
        if path.startswith("/api/") or path in ("/search", "/locations", "/route", "/study-spaces", "/items", "/events", "/profile"):
            handled = self.dispatch_api_get(path, query_params)
            if handled is not None:
                return

        # Static File Serving (with SPA routing fallback to index.html)
        url_path = parsed.path
        clean_file_path = url_path.lstrip("/\\")
        file_path = os.path.join(BASE_DIR, clean_file_path)

        if clean_file_path and os.path.isfile(file_path):
            self.path = url_path
            return super().do_GET()
        else:
            self.path = "/index.html"
            return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()

        handled = self.dispatch_api_post(path, body)
        if handled is not None:
            return

        self.send_json(error_response(f"Endpoint {path} not found", 404), 404)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()

        clean_path = path[4:] if path.startswith("/api") else path
        if clean_path in ("/profile", "/user/profile"):
            return self.send_json(handle_update_profile(body, self.headers))

        if clean_path == "/profile/interests":
            return self.send_json(handle_update_interests(body, self.headers))

        self.send_json(error_response("Not found", 404), 404)

    def guess_type(self, path):
        clean = path.split("?")[0].split("#")[0]
        if clean.endswith('.js') or clean.endswith('.mjs'):
            return 'application/javascript'
        if clean.endswith('.css'):
            return 'text/css'
        if clean.endswith('.svg'):
            return 'image/svg+xml'
        if clean.endswith('.webp'):
            return 'image/webp'
        if clean.endswith('.png'):
            return 'image/png'
        if clean.endswith('.jpg') or clean.endswith('.jpeg'):
            return 'image/jpeg'
        if clean.endswith('.json'):
            return 'application/json'
        return super().guess_type(clean)

class UniPulseThreadingServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

def run_server(port=PORT):
    ensure_database_ready()
    handler = UniPulseRequestHandler
    try:
        with UniPulseThreadingServer(("", port), handler) as httpd:
            print(f"=====================================================")
            print(f"  UniPulse Campus Platform & API is running live at:")
            print(f"  http://localhost:{port}")
            print(f"  REST API root: http://localhost:{port}/api")
            print(f"  Realtime SSE:  http://localhost:{port}/api/realtime/study-spaces")
            print(f"  Serving files from: {BASE_DIR}")
            print(f"=====================================================")
            httpd.serve_forever()
    except OSError as e:
        if "Address already in use" in str(e) or "10048" in str(e) or getattr(e, "winerror", None) == 10048:
            print(f"Port {port} in use, trying port {port + 1}...")
            run_server(port + 1)
        else:
            raise e

if __name__ == '__main__':
    port = PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)
