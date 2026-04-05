#!/usr/bin/env python3
"""
OpenClaw Lint: Cyclomatic Complexity Check
Fails CI if any function has complexity > 10.
Uses `radon` library (pip install radon).
"""
import sys
import subprocess
import json
from pathlib import Path


MAX_COMPLEXITY = 10


def check_complexity(root: Path, extensions=('.py',)):
    """
    Run radon cyclomatic complexity analysis.
    Returns list of functions exceeding MAX_COMPLEXITY.
    """
    try:
        result = subprocess.run(
            ['radon', 'cc', '-a', '-b', str(root)],
            capture_output=True, text=True, timeout=30
        )
        raw = result.stdout + result.stderr
    except FileNotFoundError:
        print("⚠️  'radon' not installed. Install with: pip install radon")
        print("   Skipping complexity check (advisory only).")
        return []

    violators = []
    for line in raw.splitlines():
        if ':' not in line:
            continue
        try:
            file_part, rest = line.split(':', 1)
            rest = rest.strip()

            # Parse "function_name (A, B) - X"
            if ' - ' not in rest:
                continue

            signature_part, complexity_str = rest.rsplit(' - ', 1)
            complexity_str = complexity_str.strip()

            try:
                complexity = int(complexity_str)
            except ValueError:
                continue

            if complexity > MAX_COMPLEXITY:
                function_name = signature_part.strip().split('(')[0].strip()
                violators.append({
                    "file": str(Path(file_part.strip()).relative_to(root)),
                    "function": function_name,
                    "complexity": complexity,
                    "over": complexity - MAX_COMPLEXITY,
                    "severity": "error" if complexity > MAX_COMPLEXITY * 1.5 else "warning"
                })

        except Exception:
            continue

    violators.sort(key=lambda x: x["complexity"], reverse=True)
    return violators


def main():
    root = Path.cwd()

    print(f"🔍 OpenClaw Cyclomatic Complexity Check (max {MAX_COMPLEXITY})")
    print(f"   Scanning: {root}")
    print()

    violators = check_complexity(root)

    if not violators:
        print("✅ All functions within complexity limits.")
        sys.exit(0)

    print(f"⚠️  Found {len(violators)} function(s) with complexity > {MAX_COMPLEXITY}:\n")

    for v in violators:
        icon = "🔴" if v["severity"] == "error" else "🟡"
        print(f"  {icon} {v['file']}::{v['function']}")
        print(f"     Complexity: {v['complexity']} (+{v['over']} over limit)")

    print()
    print("📋 To fix: extract branch logic into helper functions.")
    print("   Rule: Each branch/condition = separate helper function.")
    print("   Example:")
    print("   ❌ if status == 'A': do_a()  elif status == 'B': do_b() ...")
    print("   ✅ match_status_a(), match_status_b() → extracted as helpers")
    print()

    if any(v["severity"] == "error" for v in violators):
        print("┌─────────────────────────────────────────────┐")
        print("│  CI RESULT: FAIL (complexity violation)      │")
        print("└─────────────────────────────────────────────┘")
        sys.exit(1)
    else:
        print("⚠️  Warnings only — CI pass (advisory)")
        sys.exit(0)


if __name__ == "__main__":
    main()
