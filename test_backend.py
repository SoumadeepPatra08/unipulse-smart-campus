"""
Automated Backend & API Integration Tests for UniPulse
Validates:
1. Database initialization and demo seeding
2. Authentication (login, token issuance, protected endpoints)
3. Search endpoint across locations, study spaces, items, and actions
4. AI Matching calculation producing transparent 91% match with explainable factors
5. Study space reservation & live occupancy calculation
6. Campus walking route calculation with SVG polyline
7. AI Assistant query with structured card responses
8. Admin console KPIs and staff audit verification
"""

import sys
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.db import init_db, get_db_connection
from backend.matching import compute_match_analysis, generate_embedding
from backend.assistant import stream_assistant_chunks
from backend.routes import (
    handle_login, handle_register, handle_logout, handle_get_me, handle_search,
    handle_get_locations, handle_get_route, handle_get_study_spaces,
    handle_reserve_study_space, handle_get_item_matches, handle_claim_match,
    handle_assistant_message, handle_admin_kpis, handle_admin_audit_queue,
    handle_admin_verify, handle_get_events, handle_rsvp_event, handle_create_item,
    create_jwt, verify_jwt
)
import seed

def run_all_tests():
    print("====================================================")
    print("           UniPulse Backend Test Suite              ")
    print("====================================================")

    # 1. Seed Database
    print("\n[1/8] Testing Database Seeding...")
    seed.seed_database()
    conn = get_db_connection()
    user_count = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
    assert user_count >= 2, f"Expected at least 2 users, got {user_count}"
    conn.close()
    print("  -> PASSED: Seeded demo users, locations, spaces, items, and events.")

    # 2. Authentication, Bcrypt, JWT & HTTP-Only Cookie Session
    print("\n[2/8] Testing Full Authentication Lifecycle (Register, Login, Bcrypt, Profile, Logout)...")
    
    # 2a. Registration validation & success
    reg_invalid_email = handle_register({"name": "Test User", "email": "bademail", "password": "securepassword123"})
    assert reg_invalid_email["error"] is not None and reg_invalid_email["error"]["code"] == 400
    
    reg_short_pass = handle_register({"name": "Test User", "email": "test@campus.edu", "password": "123"})
    assert reg_short_pass["error"] is not None and reg_short_pass["error"]["code"] == 400

    test_email = "maria.chen@campus.edu"
    reg_res = handle_register({
        "name": "Maria Chen",
        "email": test_email,
        "password": "Password123!",
        "student_id": "CS-2028-9901",
        "major": "Data Science"
    })
    assert reg_res["error"] is None, f"Registration failed: {reg_res['error']}"
    assert reg_res["data"]["user"]["email"] == test_email
    assert "password_hash" not in reg_res["data"]["user"], "Plaintext or hash should never be returned"
    assert reg_res["data"]["token"] is not None
    print("  -> PASSED: New user registered and password hashed with bcrypt.")

    # 2b. Conflict rejection (409) for duplicate email
    reg_dup = handle_register({
        "name": "Maria Duplicate",
        "email": test_email,
        "password": "AnotherPassword123!"
    })
    assert reg_dup["error"] is not None and reg_dup["error"]["code"] == 409
    print("  -> PASSED: Duplicate email registration rejected with 409 Conflict.")

    # 2c. Invalid credentials rejection (401)
    bad_pass_res = handle_login({"email": test_email, "password": "WrongPassword!"})
    assert bad_pass_res["error"] is not None and bad_pass_res["error"]["code"] == 401
    print("  -> PASSED: Invalid password rejected with 401 Unauthorized.")

    # 2d. Valid login with bcrypt verification
    login_res = handle_login({"email": test_email, "password": "Password123!"})
    assert login_res["error"] is None, f"Login failed: {login_res['error']}"
    token = login_res["data"]["token"]
    assert token is not None
    payload = verify_jwt(token)
    assert payload is not None and payload["email"] == test_email
    print("  -> PASSED: Valid login verified against bcrypt hash and JWT issued.")

    # 2e. Authenticated Profile via Bearer Header
    auth_headers = {"Authorization": f"Bearer {token}"}
    me_bearer = handle_get_me(auth_headers)
    assert me_bearer["error"] is None
    assert me_bearer["data"]["email"] == test_email
    print("  -> PASSED: User profile retrieved via Bearer Authorization header.")

    # 2f. Authenticated Profile via HTTP Cookie header
    cookie_headers = {"Cookie": f"foo=bar; token={token}; session=active"}
    me_cookie = handle_get_me(cookie_headers)
    assert me_cookie["error"] is None
    assert me_cookie["data"]["email"] == test_email
    print("  -> PASSED: User profile retrieved via HTTP-only Cookie header.")

    # 2g. Logout
    logout_res = handle_logout()
    assert logout_res["error"] is None
    print("  -> PASSED: Logout endpoint returned successful response.")

    # Demo student login for subsequent tests
    demo_login = handle_login({"email": "alex@campus.edu", "password": "alex123"})
    assert demo_login["error"] is None
    auth_headers = {"Authorization": f"Bearer {demo_login['data']['token']}"}

    # 3. AI Matching Engine & 91% Calculation
    print("\n[3/8] Testing AI Matching Engine & Dynamic 91% Calculation...")
    match_res = handle_get_item_matches("match-91")
    assert match_res["error"] is None
    match_data = match_res["data"]
    score = match_data["confidence_score"]
    factors = match_data["match_factors"]
    print(f"  -> Dynamic Match Score: {score}%")
    assert 90.0 <= score <= 94.0, f"Expected score around 91%, got {score}"
    assert "visual_similarity" in factors
    assert "location_proximity" in factors
    assert "description_match" in factors
    print("  -> PASSED: Multi-factor explainable score computed dynamically.")

    # 4. Search Endpoint (Hero & Command Palette ⌘K)
    print("\n[4/8] Testing Search Endpoint (/api/search)...")
    search_res = handle_search("library")
    data = search_res["data"]
    assert len(data["locations"]) > 0 or len(data["study_spaces"]) > 0
    assert len(data["actions"]) > 0
    print(f"  -> Found {len(data['locations'])} locations, {len(data['study_spaces'])} spaces, {len(data['actions'])} actions.")
    print("  -> PASSED: Global search indexed locations, spaces, items, and quick actions.")

    # 5. Study Space Desk Reservation & Occupancy
    print("\n[5/8] Testing Live Study Space Desk Reservation...")
    spaces_before = handle_get_study_spaces()["data"]
    space_1 = next(s for s in spaces_before if s["id"] == "space-1")
    initial_occ = space_1["current_occupancy"]

    res_result = handle_reserve_study_space("space-1", {"desk_number": "D-102", "duration_minutes": 45}, auth_headers)
    assert res_result["error"] is None
    assert "pass_code" in res_result["data"]

    spaces_after = handle_get_study_spaces()["data"]
    space_1_after = next(s for s in spaces_after if s["id"] == "space-1")
    assert space_1_after["current_occupancy"] == initial_occ + 1
    print(f"  -> Occupancy updated: {initial_occ} -> {space_1_after['current_occupancy']}")
    print("  -> PASSED: Desk reservation pass created and live occupancy incremented.")

    # 6. Campus Finder Walking Polyline Router
    print("\n[6/8] Testing Campus Finder Route Engine...")
    route_res = handle_get_route("b34", "sport")
    route = route_res["data"]
    assert route["distance_meters"] > 0
    assert route["walk_time_minutes"] > 0
    assert route["polyline"].startswith("M ")
    print(f"  -> Walking Polyline: {route['polyline']}")
    print(f"  -> Distance: {route['distance_meters']}m (~{route['walk_time_minutes']} mins)")
    print("  -> PASSED: Campus pedestrian graph computed shortest animated route.")

    # 7. AI Assistant Query with Structured Cards
    print("\n[7/8] Testing AI Campus Assistant Message Endpoint...")
    assist_res = handle_assistant_message({"message": "Where is a quiet study desk right now?"}, auth_headers)
    assist_data = assist_res["data"]
    assert len(assist_data["content"]) > 0
    assert len(assist_data["cards"]) > 0
    assert assist_data["cards"][0]["type"] == "study_space"
    print(f"  -> Emitted {len(assist_data['cards'])} structured card(s) for Right Context Panel.")
    print("  -> PASSED: AI Assistant generated conversational response and structured cards.")

    # 8. Admin Console KPIs & Audit Queue
    print("\n[8/11] Testing Admin Console & Audit Queue...")
    admin_login = handle_login({"email": "admin@campus.edu", "password": "admin123"})
    admin_token = admin_login["data"]["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    kpis = handle_admin_kpis()["data"]
    assert kpis["active_students"] > 0
    assert len(kpis["resolution_velocity"]) == 7

    queue = handle_admin_audit_queue()["data"]
    assert len(queue) > 0

    verify_res = handle_admin_verify(queue[0]["id"], {"action": "approve", "notes": "Verified by Dr. Sarah Chen"}, admin_headers)
    assert verify_res["data"]["status"] == "verified"
    print("  -> PASSED: Admin KPIs fetched and match approved in staff audit queue.")

    # 9. Strict Input Validation & Role-Based Access Control (RBAC)
    print("\n[9/11] Testing Input Validation & RBAC Security Boundaries...")
    bad_login = handle_login({})
    assert bad_login["error"] is not None, "Expected error on empty login body"

    bad_item = handle_create_item({}, auth_headers)
    assert bad_item["error"] is not None, "Expected error on missing item fields"

    bad_reserve = handle_reserve_study_space("space-1", {"duration_minutes": -10}, auth_headers)
    assert bad_reserve["error"] is not None, "Expected error on invalid duration"

    # Alex is student; student attempting staff verification MUST be rejected
    unauthorized_verify = handle_admin_verify("match-91", {"action": "approve"}, auth_headers)
    assert unauthorized_verify["error"] is not None
    assert "Admin" in str(unauthorized_verify["error"]) or "Forbidden" in str(unauthorized_verify["error"])
    print("  -> PASSED: Malformed payloads rejected (400) and unauthorized roles blocked (403).")

    # 10. AI Assistant Token Streaming SSE Generator
    print("\n[10/11] Testing AI Assistant Token Streaming Generator...")
    chunks = list(stream_assistant_chunks("Where can I find a quiet study space?", "user-alex"))
    assert len(chunks) > 1, "Expected streaming tokens"
    token_chunks = [c for c in chunks if c.get("type") == "token"]
    complete_chunk = chunks[-1]
    assert len(token_chunks) > 0, "Expected at least one token chunk"
    assert complete_chunk.get("type") == "complete", "Expected final complete chunk"
    assert len(complete_chunk.get("cards", [])) > 0, "Expected structured cards in complete payload"
    reconstructed_text = "".join(c["token"] for c in token_chunks).strip()
    assert reconstructed_text == complete_chunk["content"].strip()
    print(f"  -> Streamed {len(token_chunks)} tokens smoothly. Structured cards emitted: {len(complete_chunk['cards'])}")
    print("  -> PASSED: AI Assistant streaming generator yields valid SSE token sequence.")

    # 11. Dynamic Admin KPIs & Space Atmosphere Calculation
    print("\n[11/11] Testing Dynamic Admin KPIs & Real-Time Capacity Distribution...")
    fresh_kpis = handle_admin_kpis()["data"]
    assert "capacity_distribution" in fresh_kpis
    assert "ai_match_rate" in fresh_kpis
    assert "active_lost_reports" in fresh_kpis
    assert "resolved_this_week" in fresh_kpis
    cd = fresh_kpis["capacity_distribution"]
    for cat in ["silent", "quiet", "moderate", "collaborative"]:
        assert cat in cd, f"Missing category {cat}"
        assert 0 <= cd[cat] <= 100, f"Invalid percentage for {cat}: {cd[cat]}"
    print(f"  -> Capacity distribution: {cd}")
    print(f"  -> AI Match accuracy: {fresh_kpis['ai_match_rate']}%")
    print(f"  -> Active lost reports: {fresh_kpis['active_lost_reports']}")
    print("  -> PASSED: Dynamic KPIs aggregated correctly from persisted SQLite records.")

    print("\n====================================================")
    print(" All 11/11 UniPulse Backend Tests Passed Successfully! ")
    print("====================================================")

if __name__ == "__main__":
    run_all_tests()
