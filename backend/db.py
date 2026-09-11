"""
UniPulse Database Engine (SQLite with JSON support)
Provides connection pooling, table schema creation, and transactional helpers.
"""

import os
import sqlite3
import json
import uuid
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "unipulse.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        student_id TEXT,
        major TEXT,
        grad_year TEXT,
        interests TEXT, -- JSON array
        avatar_url TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # Locations Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        type TEXT NOT NULL, -- block | library | sports_complex | study_space
        svg_x REAL NOT NULL,
        svg_y REAL NOT NULL,
        description TEXT,
        hours TEXT,
        amenities TEXT -- JSON array
    );
    """)

    # Study Spaces Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS study_spaces (
        id TEXT PRIMARY KEY,
        location_id TEXT NOT NULL,
        name TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        current_occupancy INTEGER NOT NULL,
        noise_rating TEXT NOT NULL, -- Silent Focus | Quiet | Moderate | Collaborative
        has_power BOOLEAN NOT NULL DEFAULT 1,
        available_desks TEXT, -- JSON array
        updated_at TEXT NOT NULL,
        FOREIGN KEY (location_id) REFERENCES locations(id)
    );
    """)

    # Reservations Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        study_space_id TEXT NOT NULL,
        desk_number TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active', -- active | cancelled | completed
        pass_code TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (study_space_id) REFERENCES study_spaces(id)
    );
    """)

    # Lost Items Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lost_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        kind TEXT NOT NULL, -- lost | found
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        image_url TEXT,
        location_id TEXT,
        embedding TEXT, -- JSON array of floats (vector representation)
        status TEXT NOT NULL DEFAULT 'open', -- open | matched | claimed | resolved
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (location_id) REFERENCES locations(id)
    );
    """)

    # Item Matches Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS item_matches (
        id TEXT PRIMARY KEY,
        lost_item_id TEXT NOT NULL,
        found_item_id TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        match_factors TEXT, -- JSON object
        status TEXT NOT NULL DEFAULT 'pending_review', -- pending_review | verified | claimed | rejected
        created_at TEXT NOT NULL,
        FOREIGN KEY (lost_item_id) REFERENCES lost_items(id),
        FOREIGN KEY (found_item_id) REFERENCES lost_items(id)
    );
    """)

    # Assistant Messages Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assistant_msgs (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_id TEXT,
        role TEXT NOT NULL, -- user | assistant
        content TEXT NOT NULL,
        cards TEXT, -- JSON array
        created_at TEXT NOT NULL
    );
    """)

    # Audit Log Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        actor_id TEXT,
        action TEXT NOT NULL,
        target TEXT NOT NULL,
        details TEXT, -- JSON object
        created_at TEXT NOT NULL
    );
    """)

    # Campus Events Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        date_str TEXT NOT NULL,
        time_str TEXT NOT NULL,
        organizer TEXT NOT NULL,
        tags TEXT, -- JSON array
        attendees_count INTEGER DEFAULT 0
    );
    """)

    # Event RSVPs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS event_rsvps (
        user_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (user_id, event_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (event_id) REFERENCES events(id)
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database tables initialized successfully at:", DB_PATH)
