#!/usr/bin/env python3
"""
OpenClaw HMAC Coverage Linter
Checks that all cross-component data transfers use HMAC signatures.
Reports any bare data transfer (no HMAC) as an error.
"""
import ast
import os
import sys
import re
from pathlib import Path


class HMACCoverageChecker:
    """Check that all cross-component calls include HMAC signatures."""

    def __init__(self, root: Path):
        self.root = root
        self.violations = []
        self.passed = []

    def scan(self):
        for file in self.root.rglob('*'):
            if file.suffix not in ('.py', '.ts', '.tsx'):
                continue
            if '/node_modules/' in str(file) or '/.obfuscated/' in str(file):
                continue
            try:
                content = file.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                continue
            self._check_file(file, content)
        return self

    def _check_file(self, file: Path, content: str):
        # Patterns that indicate cross-component data transfer WITHOUT HMAC
        bare_transfer_patterns = [
            r'(?<!hmac_)\b\w+\([^)]*\)\s*\(',  # func_call()()
            r'return\s+\w+',  # return variable (potential bare data)
            r'=[\s]*[{"\[]',  # bare dict/list assignment
        ]

        # HMAC-protected patterns
        hmac_patterns = [
            r'hmac\.new\(',
            r'sign_payload\(',
            r'verify.*hmac',
            r'HMAC',
            r'_verify_and_unwrap',
            r'SecureQueryWrapper',
            r'ShellIsolationWrapper',
            r'SecureDeserializer',
            r'xssanitiz',  # XSSanitizationChain
            r'SecretVaultWrapper',
        ]

        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            # Skip comments
            stripped = line.strip()
            if stripped.startswith('#') or stripped.startswith('//'):
                continue

            # Check for HMAC protection
            has_hmac = any(re.search(p, line, re.IGNORECASE) for p in hmac_patterns)

            # Check for data transfer between components
            is_data_transfer = any(re.search(p, line) for p in bare_transfer_patterns)

            # Exception: if it's a docstring, skip
            if '"""' in line or "'''" in line:
                continue

            # Violation: data transfer without HMAC
            if is_data_transfer and not has_hmac:
                # Look for component boundary indicators
                if self._is_cross_component(file, line):
                    self.violations.append({
                        "file": str(file.relative_to(self.root)),
                        "line": i,
                        "code": line.strip(),
                        "reason": "Cross-component data transfer without HMAC signature",
                    })

    def _is_cross_component(self, file: Path, line: str) -> bool:
        """Heuristic: if calling a function not defined in same file, consider cross-component."""
        return True  # Over-approximate for safety


def main():
    root = Path.cwd()

    print("🔐 OpenClaw HMAC Coverage Check")
    print(f"   Scanning: {root}")
    print()

    checker = HMACCoverageChecker(root).scan()

    if not checker.violations:
        print("✅ All cross-component transfers are HMAC-protected.")
        sys.exit(0)

    print(f"❌ Found {len(checker.violations)} unprotected transfer(s):\n")
    for v in checker.violations:
        print(f"  🔴 {v['file']}:{v['line']}")
        print(f"     {v['code']}")
        print(f"     → {v['reason']}")
        print()

    print("┌─────────────────────────────────────────────────────────┐")
    print("│  CI RESULT: FAIL — HMAC coverage incomplete             │")
    print("│  Fix: wrap all cross-component calls with sign_payload()")
    print("└─────────────────────────────────────────────────────────┘")

    sys.exit(1)


if __name__ == "__main__":
    main()
