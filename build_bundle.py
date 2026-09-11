#!/usr/bin/env python3
"""
Bundle builder for UniPulse
Combines all ESM modules into a single zero-dependency standalone script
so UniPulse can run smoothly both over local HTTP servers and direct file:// scheme in browsers.
"""

import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def build_bundle():
    # Ordered list of modules so dependencies precede consumers
    files = [
        "js/data.js",
        "js/components/toasts.js",
        "js/components/modals.js",
        "js/components/sidebar.js",
        "js/components/header.js",
        "js/components/avatarPicker.js",
        "js/views/login.js",
        "js/views/dashboard.js",
        "js/views/assistant.js",
        "js/views/campusMap.js",
        "js/views/lostFound.js",
        "js/views/spaces.js",
        "js/views/events.js",
        "js/views/profile.js",
        "js/views/admin.js",
        "js/app.js"
    ]

    bundle_lines = [
        "/**",
        " * UniPulse Standalone Production Bundle",
        " * Designed for zero-dependency execution across HTTP and direct file:// preview.",
        " */",
        "(function() {",
        "  'use strict';",
        ""
    ]

    for rel_path in files:
        full_path = os.path.join(BASE_DIR, rel_path)
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Strip export statements: 'export const ...' -> 'const ...', 'export function ...' -> 'function ...', 'export async function' -> 'async function'
        content = re.sub(r'export\s+((?:async\s+)?function|const|let|var|class)\s+', r'\1 ', content)
        # Strip export default
        content = re.sub(r'export\s+default\s+', '', content)
        # Strip export { ... }
        content = re.sub(r'export\s*\{[^}]*\};?', '', content)
        # Strip import statements (single or multiline)
        content = re.sub(r'import\s+[\s\S]*?from\s+[\'"].*?[\'"];?', '', content)
        content = re.sub(r'import\s+[\'"].*?[\'"];?', '', content)

        bundle_lines.append(f"  // --- Source: {rel_path} ---")
        for line in content.splitlines():
            bundle_lines.append("  " + line)
        bundle_lines.append("")

    bundle_lines.append("})();")

    bundle_path = os.path.join(BASE_DIR, "js", "bundle.js")
    with open(bundle_path, "w", encoding="utf-8") as f:
        f.write("\n".join(bundle_lines))

    print(f"Successfully generated standalone bundle at: {bundle_path} ({os.path.getsize(bundle_path)} bytes)")

if __name__ == "__main__":
    build_bundle()
