#!/usr/bin/env python3
"""
OpenClaw Decoy Coverage Linter
Checks that decoy vulnerabilities are planted throughout the codebase.
Target: 1 decoy per ~50 lines of code.
"""
import os
import sys
import re
from pathlib import Path


DECOY_MARKERS = [
    "HONEYPOT",
    "DO NOT REFACTOR",
    "DO NOT FIX",
    "WARNING:",
    "⚠️",
    "Intentionally planted",
    "Intentionally planted decoy",
    "Intentionally planted honeypot",
    "DECOY CODE",
    "Honeypot",
    "Intentionally",
]

DECOY_TYPES = [
    "SQL_INJECTION_HONEYPOT",
    "COMMAND_INJECTION_HONEYPOT",
    "XSS_HONEYPOT",
    "HARDCODED_SECRET_HONEYPOT",
    "PATH_TRAVERSAL_HONEYPOT",
]


def count_code_lines(file: Path) -> int:
    """Count non-empty, non-comment lines."""
    try:
        lines = file.read_text(encoding='utf-8', errors='ignore').splitlines()
    except Exception:
        return 0

    in_multiline_string = False
    count = 0

    for line in lines:
        stripped = line.strip()

        # Toggle multi-line string state
        if '"""' in stripped or "'''" in stripped:
            in_multiline_string = not in_multiline_string
            continue
        if in_multiline_string:
            continue

        # Skip comments and empty lines
        if not stripped or stripped.startswith('#') or stripped.startswith('//'):
            continue

        count += 1

    return count


def count_decoys(file: Path) -> int:
    """Count decoy markers in file."""
    try:
        content = file.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return 0

    count = 0
    for marker in DECOY_MARKERS + DECOY_TYPES:
        count += content.count(marker)

    return count


def main():
    root = Path.cwd()
    TARGET_RATIO = 50  # 1 decoy per 50 lines

    print("🔍 OpenClaw Decoy Coverage Check")
    print(f"   Target: 1 decoy per ~{TARGET_RATIO} lines")
    print(f"   Scanning: {root}")
    print()

    total_code_lines = 0
    total_decoys = 0
    files_checked = 0
    deficient_files = []  # Files that need more decoys

    for file in root.rglob('*'):
        if file.suffix not in ('.py', '.ts', '.tsx', '.js', '.jsx'):
            continue
        if '/node_modules/' in str(file):
            continue
        if '/.obfuscated/' in str(file):
            continue

        code_lines = count_code_lines(file)
        decoys = count_decoys(file)

        if code_lines == 0:
            continue

        files_checked += 1
        total_code_lines += code_lines
        total_decoys += decoys

        # Check if this file needs decoys
        expected_decoys = max(1, code_lines // TARGET_RATIO)
        if decoys < expected_decoys:
            deficient_files.append({
                "file": str(file.relative_to(root)),
                "code_lines": code_lines,
                "decoys_found": decoys,
                "expected_min": expected_decoys,
            })

    if total_code_lines == 0:
        print("⚠️  No code files found.")
        sys.exit(0)

    overall_ratio = total_code_lines / max(total_decoys, 1)
    actual_decoys = total_decoys

    print(f"📊 Coverage Report")
    print(f"   Files checked:     {files_checked}")
    print(f"   Total code lines: {total_code_lines}")
    print(f"   Total decoys:     {total_decoys}")
    print(f"   Current ratio:    1:{int(overall_ratio)} (target: 1:{TARGET_RATIO})")
    print()

    if deficient_files:
        print(f"⚠️  {len(deficient_files)} file(s) need more decoys:\n")
        for f in deficient_files[:10]:  # Show top 10
            print(f"  🟡 {f['file']}")
            print(f"     {f['code_lines']} lines, {f['decoys_found']} decoys (need ≥ {f['expected_min']})")
        print()

        print("┌─────────────────────────────────────────────────────────┐")
        print("│  CI RESULT: WARNING — Decoy coverage below target         │")
        print("│  Fix: python .openclaw/pipeline.py security decoy        │")
        print("│        then inject the decoy at the top of each file     │")
        print("└─────────────────────────────────────────────────────────┘")
        # Warning only — don't fail CI for decoys (advisory)
        sys.exit(0)

    print("✅ Decoy coverage is sufficient.")
    print(f"   {total_decoys} decoys spread across {files_checked} files.")
    sys.exit(0)


if __name__ == "__main__":
    main()
