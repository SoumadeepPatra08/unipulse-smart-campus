"""
UniPulse Database Seeder
Populates rich, realistic demo data for students, admins, campus landmarks,
live study spaces, Lost & Found 91% candidate match, and campus events.
"""

import json
from datetime import datetime, timezone
from backend.db import init_db, get_db_connection
from backend.matching import generate_embedding, compute_match_analysis
from backend.auth import hash_password

def seed_database():
    init_db()
    conn = get_db_connection()
    cur = conn.cursor()

    # Clear existing data cleanly
    tables = [
        "event_rsvps", "events", "audit_log", "assistant_msgs",
        "item_matches", "lost_items", "reservations", "study_spaces",
        "locations", "users"
    ]
    for tbl in tables:
        cur.execute(f"DELETE FROM {tbl};")

    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    alex_hash = hash_password("alex123")
    admin_hash = hash_password("admin123")

    # 1. Users
    users_data = [
        (
            "user-alex",
            "Alex Rivera",
            "alex@campus.edu",
            alex_hash,
            "student",
            "CS-2027-4819",
            "B.S. Computer Science",
            "'27",
            json.dumps(["AI & Coding", "Robotics", "Hackathons", "Campus Life"]),
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            now_iso
        ),
        (
            "user-admin",
            "Dr. Sarah Chen",
            "admin@campus.edu",
            admin_hash,
            "admin",
            "FAC-1002",
            "Campus Operations Lead",
            "Staff",
            json.dumps(["Operations", "Safety", "Facilities"]),
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            now_iso
        )
    ]
    cur.executemany("""
    INSERT INTO users (id, name, email, password_hash, role, student_id, major, grad_year, interests, avatar_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, users_data)

    # 2. Locations
    locations_data = [
        (
            "b34",
            "Block 34 (Engineering & CS)",
            "B34",
            "block",
            180.0,
            190.0,
            "Home to School of Computer Science & Robotics Labs. Modern glass atrium with labs and study pods.",
            "7:00 AM - 10:00 PM",
            json.dumps(["Cafe", "Elevator", "Computer Labs", "Restrooms", "High-speed WiFi"])
        ),
        (
            "lib",
            "Main University Library",
            "LIB",
            "library",
            460.0,
            240.0,
            "5-story research facility with quiet study zones, 24/7 reading rooms, and media center.",
            "8:00 AM - 11:00 PM",
            json.dumps(["Silent Zones", "Printing", "Cafe", "Study Rooms", "Power Outlets"])
        ),
        (
            "sport",
            "Sports & Recreation Complex",
            "SC",
            "sports_complex",
            720.0,
            380.0,
            "Olympic swimming pool, fitness gym, indoor basketball courts, climbing wall, and track.",
            "6:00 AM - 10:00 PM",
            json.dumps(["Lockers", "Showers", "Gym", "Juice Bar", "Equipment Rental"])
        ),
        (
            "sc",
            "Student Commons & Dining",
            "SCX",
            "study_space",
            420.0,
            420.0,
            "Central student hub with dining hall, bookstore, student government office, and collaborative lounge.",
            "7:30 AM - 9:30 PM",
            json.dumps(["Dining Hall", "Bookstore", "ATM", "Microwaves", "Lounge"])
        ),
        (
            "inn",
            "Innovation & Incubation Hub",
            "INNO",
            "block",
            260.0,
            480.0,
            "Startup incubator, maker space, 3D printing lab, and collaborative project rooms.",
            "8:00 AM - 9:00 PM",
            json.dumps(["3D Printers", "Meeting Pods", "High-speed WiFi", "Soldering Stations"])
        )
    ]
    cur.executemany("""
    INSERT INTO locations (id, name, code, type, svg_x, svg_y, description, hours, amenities)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, locations_data)

    # 3. Study Spaces
    spaces_data = [
        (
            "space-1",
            "lib",
            "Library Level 3 — Silent Focus Floor",
            120,
            94,
            "Silent Focus",
            1,
            json.dumps(["D-102", "D-104", "D-109", "D-115", "D-118", "D-122"]),
            now_iso
        ),
        (
            "space-2",
            "b34",
            "Turing Tech Commons — 2nd Floor",
            85,
            36,
            "Moderate",
            1,
            json.dumps(["T-01", "T-04", "T-08", "T-14", "T-19", "T-22", "T-25"]),
            now_iso
        ),
        (
            "space-3",
            "inn",
            "Maker Space Collaborative Lounge",
            60,
            49,
            "Collaborative",
            1,
            json.dumps(["M-03", "M-07", "M-11"]),
            now_iso
        ),
        (
            "space-4",
            "sc",
            "North Atrium Quiet Pods",
            40,
            21,
            "Quiet",
            1,
            json.dumps(["P-02", "P-05", "P-09", "P-14"]),
            now_iso
        )
    ]
    cur.executemany("""
    INSERT INTO study_spaces (id, location_id, name, capacity, current_occupancy, noise_rating, has_power, available_desks, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, spaces_data)

    # 4. Lost Items
    lost_items_data = [
        (
            "item-lost-1",
            "user-alex",
            "lost",
            "Hydro Flask Navy Blue 32oz",
            "Navy blue insulated bottle, climbing sticker on side, lost near 2nd floor cubicles",
            "Bottles & Containers",
            "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80",
            "lib",
            json.dumps(generate_embedding("Hydro Flask Navy Blue 32oz", "Navy blue insulated bottle, climbing sticker on side, lost near 2nd floor cubicles", "Bottles & Containers", "lib")),
            "matched",
            now_iso
        ),
        (
            "item-lost-2",
            "user-alex",
            "lost",
            "Sony WH-1000XM4 Headphones",
            "Black over-ear wireless headphones with carrying case left in study room 4",
            "Electronics",
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=80",
            "b34",
            json.dumps(generate_embedding("Sony WH-1000XM4 Headphones", "Black over-ear wireless headphones with carrying case left in study room 4", "Electronics", "b34")),
            "open",
            now_iso
        ),
        (
            "item-found-1",
            "user-admin",
            "found",
            "Navy Blue Water Bottle (Hydro Flask)",
            "Found on Level 2 study desk, insulated flask with outdoor sticker",
            "Bottles & Containers",
            "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80",
            "lib",
            json.dumps(generate_embedding("Navy Blue Water Bottle (Hydro Flask)", "Found on Level 2 study desk, insulated flask with outdoor sticker", "Bottles & Containers", "lib")),
            "matched",
            now_iso
        ),
        (
            "item-found-2",
            "user-admin",
            "found",
            "Carabiner Keychain with 3 Keys & Blue Tag",
            "Found near Sports Complex entrance bench beside bike racks",
            "Keys & Cards",
            "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80",
            "sport",
            json.dumps(generate_embedding("Carabiner Keychain with 3 Keys & Blue Tag", "Found near Sports Complex entrance bench beside bike racks", "Keys & Cards", "sport")),
            "open",
            now_iso
        ),
        (
            "item-found-3",
            "user-admin",
            "found",
            "North Face Vault Backpack (Grey)",
            "Left in Student Commons booth 12 with notebooks inside",
            "Bags & Backpacks",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80",
            "sc",
            json.dumps(generate_embedding("North Face Vault Backpack (Grey)", "Left in Student Commons booth 12 with notebooks inside", "Bags & Backpacks", "sc")),
            "open",
            now_iso
        )
    ]
    cur.executemany("""
    INSERT INTO lost_items (id, user_id, kind, title, description, category, image_url, location_id, embedding, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, lost_items_data)

    # 5. Item Match (Alex's Lost Hydro Flask <-> Found at Library Desk)
    # Dynamically calculated score
    lost_obj = {
        "title": "Hydro Flask Navy Blue 32oz",
        "description": "Navy blue insulated bottle, climbing sticker on side, lost near 2nd floor cubicles",
        "category": "Bottles & Containers",
        "location_id": "lib"
    }
    found_obj = {
        "title": "Navy Blue Water Bottle (Hydro Flask)",
        "description": "Found on Level 2 study desk, insulated flask with outdoor sticker",
        "category": "Bottles & Containers",
        "location_id": "lib"
    }
    score, factors = compute_match_analysis(lost_obj, found_obj)

    cur.execute("""
    INSERT INTO item_matches (id, lost_item_id, found_item_id, confidence_score, match_factors, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    """, (
        "match-91",
        "item-lost-1",
        "item-found-1",
        score,
        json.dumps(factors),
        "pending_review",
        now_iso
    ))

    # 6. Events
    events_data = [
        (
            "ev-1",
            "Campus AI & Coding Hackathon 2026",
            "Tech",
            "Block 34 — Innovation Lab",
            "This Friday",
            "6:00 PM - 10:00 PM",
            "ACM Student Chapter & Google Developer Group",
            json.dumps(["AI & Coding", "Hackathons", "Tech", "Prizes"]),
            142
        ),
        (
            "ev-2",
            "Autonomous Drone & Robotics Workshop",
            "Engineering",
            "Block 34 — Robotics Arena",
            "Saturday",
            "2:00 PM - 5:00 PM",
            "Robotics & Mechatronics Society",
            json.dumps(["Robotics", "Hardware", "Coding"]),
            68
        ),
        (
            "ev-3",
            "Annual Campus Indie Music Festival",
            "Cultural",
            "Central Quad Amphitheater",
            "Sunday",
            "5:30 PM - 9:30 PM",
            "University Student Council",
            json.dumps(["Music", "Campus Life", "Social"]),
            320
        ),
        (
            "ev-4",
            "Interactive UI/UX Design Sprint Showcase",
            "Workshops",
            "Innovation Hub — Design Studio 4",
            "Next Tuesday",
            "4:00 PM - 6:30 PM",
            "Creative Design Collective",
            json.dumps(["Design", "Creative", "Tech"]),
            85
        )
    ]
    cur.executemany("""
    INSERT INTO events (id, title, category, location, date_str, time_str, organizer, tags, attendees_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, events_data)

    # 7. Event RSVP for Alex
    cur.execute("""
    INSERT INTO event_rsvps (user_id, event_id, created_at)
    VALUES (?, ?, ?);
    """, ("user-alex", "ev-1", now_iso))

    # 8. Audit Log
    cur.execute("""
    INSERT INTO audit_log (id, actor_id, action, target, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?);
    """, (
        "audit-01",
        "user-admin",
        "SYSTEM_INITIALIZED",
        "system:unipulse",
        json.dumps({"message": "UniPulse campus database seeded successfully with demo profiles"}),
        now_iso
    ))

    conn.commit()
    conn.close()
    print(f"Database seeded successfully! Dynamic match score calculated at: {score}%")

if __name__ == "__main__":
    seed_database()
