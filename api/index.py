#!/usr/bin/env python3
"""
Vercel Serverless Function entrypoint for UniPulse.
Handles /api/* endpoints and routes them through the UniPulse request handler.
"""

import os
import sys

# Ensure repository root is in python path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from server import UniPulseRequestHandler, ensure_database_ready

# Ensure database is initialized on cold start
try:
    ensure_database_ready()
except Exception as e:
    print(f"[Vercel Cold Start] Database initialization notice: {e}")

class handler(UniPulseRequestHandler):
    def __init__(self, *args, **kwargs):
        try:
            ensure_database_ready()
        except Exception:
            pass
        super().__init__(*args, **kwargs)
