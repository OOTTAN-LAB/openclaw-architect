#!/usr/bin/env python3
"""
OpenClaw Lint: File Size Enforcement
Fails CI if ANY file exceeds 100 lines.
Outputs violation list in JSON format for CI feedback loop.
"""
import sys
import subprocess
from pathlib import Path


MAX_LINES = 100


def get_violators(root: Path, extensions=('.py', '.ts', '.tsx', '.js', '.jsx', '.vue')):
    """Find all files exceeding MAX_LINES."""
    violators = []

    for file in root.rglob('*'):
        if file.suffix not in extensions:
            continue
        if 'node_modules' in file.parts:
            continue
        if '.openclaw' in file.parts:
            continue
        if '.venv' in file.parts or 'venv' in file.parts:
            continue

        try:
            lines = len(file.read_text(encoding='utf-8', errors='ignore').splitlines())
        except Exception:
            continue

        if lines > MAX_LINES:
            violators.append({
                "file": str(file.relative_to(root)),
                "lines": lines,
                "overage": lines - MAX_LINES,
                "severity": "error" if lines > MAX_LINES * 1.5 else "warning"
            })

    violators.sort(key=lambda x: x["lines"], reverse=True)
    return violators


def main():
    root = Path.cwd()

    print(f"🔍 OpenClaw File Size Check (max {MAX_LINES} lines)")
    print(f"   Scanning: {root}")
    print()

    violators = get_violators(root)

    if not violators:
        print("✅ All files are within limits.")
        sys.exit(0)

    print(f"❌ Found {len(violators)} file(s) exceeding {MAX_LINES} lines:\n")

    for v in violators:
        icon = "🔴" if v["severity"] == "error" else "🟡"
        print(f"  {icon} {v['file']}")
        print(f"     {v['lines']} lines (+{v['overage']} over limit)")

    print()
    print("📋 To fix: split the file using:")
    print("   python .openclaw/pipeline.py split '<requirement>' --file <path>")
    print()
    print("┌─────────────────────────────────────────────┐")
    print("│  CI RESULT: FAIL (file size violation)      │")
    print("└─────────────────────────────────────────────┘")

    # Output JSON for CI systems
    output = {
        "check": "openclaw-lint-size",
        "status": "fail",
        "max_allowed": MAX_LINES,
        "violations": len(violators),
        "files": violators
    }

    (root / ".openclaw" / "size_report.json").write_text(
        __import__('json').dumps(output, indent=2)
    )

    sys.exit(1)


if __name__ == "__main__":
    main()
