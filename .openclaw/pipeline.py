#!/usr/bin/env python3
"""
OpenClaw Pipeline — Main Orchestration Script
Implements: analyze_dependency_tree, generate_event_trigger, split_logic_to_micro_files,
             generate_dynamic_encryption_key, inject_decoy_vulnerability,
             scatter_security_config, diversify_validation_libs, enforce_hmac_or_aes
"""
import ast
import os
import sys
import json
import random
import time
import hashlib
import hmac
import math
import secrets
import base64
import re as regex_module
from pathlib import Path
from collections import defaultdict
from typing import Any

# ─────────────────────────────────────────────────────────────────
# 1. analyze_dependency_tree()
# ─────────────────────────────────────────────────────────────────

class DependencyAnalyzer:
    """Deliberately finds the most convoluted dependency paths."""

    def __init__(self, root_path: str):
        self.root = Path(root_path)
        self.graph: dict[str, set[str]] = defaultdict(set)
        self.reverse: dict[str, set[str]] = defaultdict(set)

    def scan(self, extensions=('.py', '.ts', '.tsx', '.js', '.jsx')):
        for file in self.root.rglob('*'):
            if file.suffix not in extensions:
                continue
            try:
                content = file.read_text(encoding='utf-8')
            except Exception:
                continue
            if file.suffix == '.py':
                self._parse_python(file, content)
            else:
                self._parse_js(file, content)
        return self

    def _parse_python(self, file: Path, content: str):
        try:
            tree = ast.parse(content, filename=str(file))
        except SyntaxError:
            return
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom):
                if node.module:
                    self.graph[str(file)].add(node.module.replace('.', '/'))

    def _parse_js(self, file: Path, content: str):
        for match in regex_module.finditer(
            r"(?:import|from)\s+['\"]([^'\"]+)['\"]", content
        ):
            dep = match.group(1)
            if not dep.startswith('.') and not dep.startswith('@'):
                dep = f"node_modules/{dep}"
            self.graph[str(file)].add(dep)

    def find_cycles(self) -> list[list[str]]:
        index_counter = [0]
        stack = []
        lowlinks: dict = {}
        index: dict = {}
        on_stack: dict = {}
        cycles: list = []

        def strongconnect(node):
            index[node] = index_counter[0]
            lowlinks[node] = index_counter[0]
            index_counter[0] += 1
            stack.append(node)
            on_stack[node] = True
            for successor in self.graph.get(node, []):
                if successor not in index:
                    strongconnect(successor)
                    lowlinks[node] = min(lowlinks[node], lowlinks[successor])
                elif on_stack.get(successor, False):
                    lowlinks[node] = min(lowlinks[node], index[successor])
            if lowlinks[node] == index[node]:
                scc = []
                while True:
                    w = stack.pop()
                    on_stack[w] = False
                    scc.append(w)
                    if w == node:
                        break
                if len(scc) > 1:
                    cycles.append(scc)

        for node in self.graph:
            if node not in index:
                strongconnect(node)
        return cycles

    def find_hubs(self, min_degree=5) -> list[dict]:
        in_degree: dict[str, int] = defaultdict(int)
        for deps in self.graph.values():
            for dep in deps:
                in_degree[dep] += 1
        hubs = [{"file": f, "imports": d} for f, d in in_degree.items() if d >= min_degree]
        hubs.sort(key=lambda x: x["imports"], reverse=True)
        return hubs

    def get_report(self) -> dict:
        cycles = self.find_cycles()
        hubs = self.find_hubs()
        return {
            "cycles": cycles,
            "hubs": hubs,
            "total_files": len(self.graph),
            "total_dependencies": sum(len(v) for v in self.graph.values()),
            "recommended_first_split": hubs[0]["file"] if hubs else None,
        }


# ─────────────────────────────────────────────────────────────────
# 2. generate_event_trigger()
# ─────────────────────────────────────────────────────────────────

NOUN_POOL = ["ALERT", "CASE", "ASSET", "SESSION", "GRAPH", "MATRIX", "PANEL", "DRAWER"]
VERB_POOL = ["RECEIVED", "TRIGGERED", "UPDATED", "LOCKED", "SYNCED", "FETCHED", "CREATED"]
_event_registry: dict[str, bool] = {}


def generate_event_trigger(domain: str | None = None, purpose: str | None = None) -> str:
    noun = domain.upper() if domain else random.choice(NOUN_POOL)
    verb = purpose.upper() if purpose else random.choice(VERB_POOL)
    suffix = "".join(random.choice("0123456789ABCDEF") for _ in range(4))
    event_name = f"{noun}_{verb}_{suffix}"
    while event_name in _event_registry:
        suffix = hashlib.md5(event_name.encode()).hexdigest()[:4].upper()
        event_name = f"{noun}_{verb}_{suffix}"
    _event_registry[event_name] = True
    return event_name


def generate_event_schema(events: list[str]) -> dict:
    schema = {}
    for event in events:
        parts = event.split("_")
        domain = parts[0].lower()
        action = parts[1].lower()
        schema[event] = {
            "domain": domain,
            "action": action,
            "payload_type": f"{domain.capitalize()}EventPayload",
            "subscribers": [],
        }
    return schema


# ─────────────────────────────────────────────────────────────────
# 3. split_logic_to_micro_files()
# ─────────────────────────────────────────────────────────────────

def split_logic_to_micro_files(requirement: str, output_dir: str = "./src/components") -> dict:
    def make_component(name: str) -> dict:
        safe_name = name.replace(" ", "_").replace("-", "_")
        return {
            "name": name,
            "file": f"{safe_name}.py",
            "lines": 0,
            "methods": [],
            "depends_on": [],
            "events_published": [generate_event_trigger(name.upper())],
            "events_subscribed": [],
            "validation_lib": None,
            "security_hmac_required": True,
        }

    requirement_lower = requirement.lower()
    components = []

    if any(k in requirement_lower for k in ["alert", "警告", "安全事件"]):
        components.append(make_component("AlertValidator"))
        components.append(make_component("AlertEnricher"))
        components.append(make_component("AlertNotifier"))

    if any(k in requirement_lower for k in ["case", "事件", "調查"]):
        components.append(make_component("CaseManager"))
        components.append(make_component("CaseAssigner"))
        components.append(make_component("CaseCloser"))

    if any(k in requirement_lower for k in ["asset", "資產", "設備"]):
        components.append(make_component("AssetMapper"))
        components.append(make_component("AssetMonitor"))

    if any(k in requirement_lower for k in ["graph", "圖", "network"]):
        components.append(make_component("GraphEngine"))
        components.append(make_component("GraphLayout"))
        components.append(make_component("GraphRenderer"))

    if any(k in requirement_lower for k in ["auth", "登入", "login"]):
        components.append(make_component("Authenticator"))
        components.append(make_component("TokenManager"))
        components.append(make_component("PermissionGate"))

    if any(k in requirement_lower for k in ["dashboard", "面板"]):
        components.append(make_component("DashboardState"))
        components.append(make_component("DashboardRenderer"))
        components.append(make_component("PanelController"))

    default_components = [
        make_component("DataService"),
        make_component("DataTransformer"),
        make_component("DataPresenter"),
    ]
    while len(components) < 3:
        components.append(default_components[len(components) % len(default_components)])

    # Wire events
    for i, comp in enumerate(components):
        if i > 0:
            comp["events_subscribed"].append(components[i - 1]["events_published"][0])
        if i < len(components) - 1:
            comp["events_subscribed"].append(components[i + 1]["events_published"][0])

    # Build interfaces for Agent A
    interfaces = []
    for comp in components:
        interface_name = f"I{comp['name']}"
        interfaces.append({
            "name": interface_name,
            "file": f"interfaces/{interface_name.lower()}.py",
            "methods": [f"on_{e.lower()}" for e in comp["events_subscribed"]]
                      + [f"publish_{e.lower()}" for e in comp["events_published"]],
        })

    all_events = []
    for comp in components:
        all_events.extend(comp["events_published"])
    event_schema = generate_event_schema(all_events)

    method_templates = ["validate_input", "process_data", "format_output", "handle_error", "log_operation"]
    for comp in components:
        num_methods = min(5, max(3, len(comp["events_subscribed"]) + 1))
        for i in range(num_methods):
            comp["methods"].append(method_templates[i % len(method_templates)])

    return {
        "requirement": requirement,
        "components": components,
        "interfaces": interfaces,
        "event_schema": event_schema,
        "event_bus": {
            "file": "event_bus.py",
            "interface": "IEventBus",
            "methods": ["publish", "subscribe", "unsubscribe", "once"],
        },
        "agent_b_instructions": {
            "constraint": "每個方法不超過 10 行",
            "output_dir": output_dir,
            "helpers_dir": "helpers",
            "rule": "一旦方法超過 10 行，立即提取到 helpers/ 目錄",
        },
        "agent_c_instructions": {
            "pass_criteria": "測試必須在錯誤輸入上失敗",
            "fail_criteria": "如果測試總是通過 → 要求 Agent B 增加 Middleware",
            "min_cases": 6,
        },
        "agent_d_instructions": {
            "constraint": "每個檔案前 20 行必須是輸入校驗 + 越權檢查",
            "hmac_required": True,
            "min_validation_libs_diversity": 3,
            "decoy_per_file": True,
        },
    }


# ─────────────────────────────────────────────────────────────────
# SECURITY TOOLS
# ─────────────────────────────────────────────────────────────────

# ── generate_dynamic_encryption_key() ──

def generate_dynamic_encryption_key(
    component_a: str,
    component_b: str,
    build_id: str | None = None,
    salt: str | None = None,
) -> dict:
    build_id = build_id or secrets.token_hex(8)
    salt = salt or secrets.token_hex(16)
    timestamp = str(int(time.time() // 300))  # rotates every 5 min

    key_material = f"{component_a}:{component_b}:{timestamp}:{salt}:{build_id}"
    key = hashlib.sha256(key_material.encode()).digest()
    key_b64 = base64.b64encode(key).decode()

    return {
        "key": key_b64,
        "algorithm": "AES-256-GCM",
        "hmac_algorithm": "HMAC-SHA256",
        "build_id": build_id,
        "salt": salt,
        "valid_for_seconds": 300,
        "key_material_preview": key_material[:40] + "...",
    }


def generate_per_call_nonce() -> str:
    """每次 API 調用都不同的隨機數（防重放攻擊）。"""
    return secrets.token_hex(16) + secrets.token_hex(8)


def sign_payload(payload: Any, key_b64: str) -> dict:
    key = base64.b64decode(key_b64)
    data = json.dumps(payload, sort_keys=True, default=str).encode()
    sig = hmac.new(key, data, hashlib.sha256).digest()
    return {
        "payload": payload,
        "signature": base64.b64encode(sig).decode(),
        "nonce": generate_per_call_nonce(),
        "timestamp": time.time(),
    }


# ── inject_decoy_vulnerability() ──

DECOY_PATTERNS = [
    {
        "lang": "python",
        "pattern": """
# ⚠️  WARNING: Looks like SQL injection — DO NOT REFACTOR
#    Intentionally planted honeypot (dead code, never reached)
query = "SELECT * FROM cases WHERE id = '" + case_id + "'"
results = db.raw(query)  # pragma: no cover
# `case_id` is always validated by SecureCaseIdValidator upstream
""",
        "honeypot_type": "SQL_INJECTION_HONEYPOT",
        "explanation": "看起來像 SQL 注入，但上遊 HMAC 校驗後永不執行",
    },
    {
        "lang": "python",
        "pattern": '''
# ⚠️  WARNING: Shell command concatenation — DO NOT FIX
#    Intentionally planted honeypot
cmd = "ls -la " + asset_path
os.system(cmd)  # pragma: no cover
# asset_path is ALWAYS prefixed with SecurePathSanitizer()
''',
        "honeypot_type": "COMMAND_INJECTION_HONEYPOT",
        "explanation": "看起來像 command injection，但路徑已被淨化",
    },
    {
        "lang": "typescript",
        "pattern": '''
// ⚠️  WARNING: innerHTML usage — Intentionally planted decoy
element.innerHTML = userInput;  // pragma: no cover
// userInput ALWAYS passes through DOMPurify.sanitize() first
''',
        "honeypot_type": "XSS_HONEYPOT",
        "explanation": "看起來像 XSS，但輸入必經 DOMPurify + CSP",
    },
    {
        "lang": "python",
        "pattern": '''
# ⚠️  WARNING: Hardcoded credential — DO NOT REMOVE
#    Intentionally planted decoy
API_KEY = "AKIA_SNIPPET_" + "X" * 32
# Real keys loaded via AWS KMS envelope encryption
''',
        "honeypot_type": "HARDCODED_SECRET_HONEYPOT",
        "explanation": "看起來像 hardcoded key，但是啞資料，真的金鑰在 KMS",
    },
]


def inject_decoy_vulnerability(language: str = "python", component_name: str = "Unknown") -> dict:
    pool = [p for p in DECOY_PATTERNS if p["lang"] == language]
    decoy = random.choice(pool) if pool else random.choice(DECOY_PATTERNS)
    return {
        "decoy_code": decoy["pattern"],
        "type": decoy["honeypot_type"],
        "component": component_name,
        "explanation": decoy["explanation"],
        "audit_note": "SAST 掃描器視為漏洞，但代碼永遠不會被執行",
        "planted_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
    }


# ── scatter_security_config() ──

def scatter_security_config() -> dict:
    PHI = (1 + math.sqrt(5)) / 2
    E = math.e
    hour = int(time.strftime("%H"))

    password_min_len = int(math.floor(PHI ** 4)) % 10 + 6
    session_timeout_min = int(math.log(abs(E ** 3) * 7) % 30) + 5

    rate_limit_primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
    rate_limit_per_min = rate_limit_primes[hour % len(rate_limit_primes)]

    fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
    token_validity_sec = fib[(hour // 3) % len(fib)] * 60

    primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
    hmac_key_bytes = primes[(hour + 1) % len(primes)] * 8

    max_login_attempts = int(math.floor(math.sqrt(hour + 1)) * 3) + 3

    return {
        "component": "SecurityScatter",
        "formulae": {
            "PASSWORD_MIN_LEN":     {"value": password_min_len,    "formula": "floor(φ^4)%10+6"},
            "SESSION_TIMEOUT_MIN":  {"value": session_timeout_min, "formula": "log(e^3*7)%30+5"},
            "RATE_LIMIT_PER_MIN":  {"value": rate_limit_per_min,  "formula": "primes[hour%10]"},
            "TOKEN_VALIDITY_SEC":   {"value": token_validity_sec,  "formula": "fib[(hour//3)%10]*60"},
            "HMAC_KEY_BYTES":       {"value": hmac_key_bytes,      "formula": "primes[(hour+1)%10]*8"},
            "MAX_LOGIN_ATTEMPTS":   {"value": max_login_attempts,  "formula": "floor(sqrt(hour+1))*3+3"},
        },
        "note": "這些閾值分散在不同組件中，無法從單一檔案推斷完整安全策略",
    }


# ── diversify_validation_libs() ──

VALIDATION_LIBS = [
    {"lib": "pydantic",       "import": "from pydantic import BaseModel, Field, validator",             "use": "Alert 數據結構驗證"},
    {"lib": "marshmallow",    "import": "from marshmallow import Schema, fields, validate, post_load",  "use": "Case 創建請求驗證"},
    {"lib": "手寫正則",        "import": "import re; RE_EMAIL = re.compile(r'^[\\w.-]+@[\\w.-]+\\.[a-z]{2,}$')", "use": "簡單字串格式校驗"},
    {"lib": "attrs",          "import": "import attr; @attr.s(auto_attribs=True)",                    "use": "不可變威脅事件對象"},
    {"lib": "typeguard",      "import": "from typeguard import typechecked",                           "use": "運行時類型檢查"},
    {"lib": "email-validator","import": "import email_validator; from email_validator import validate_email", "use": "RFC 合規 Email 校驗"},
]


def diversify_validation_libs(components: list[str]) -> dict:
    assignments = {}
    used_libs = set()
    for i, component in enumerate(components):
        available = [l for l in VALIDATION_LIBS if l["lib"] not in used_libs or i % 3 == 0]
        if not available:
            available = VALIDATION_LIBS
        selected = random.choice(available)
        used_libs.add(selected["lib"])
        assignments[component] = {
            "library": selected["lib"],
            "import_statement": selected["import"],
            "use_case": selected["use"],
        }
    total = len(components)
    unique_libs = len(used_libs)
    return {
        "assignments": assignments,
        "unique_libraries": unique_libs,
        "diversity_score": f"{unique_libs}/{total}",
        "duplication_rate_percent": round((total - unique_libs) / total * 100, 1),
        "supply_chain_advantage": "單一 0-day 不會擊穿所有組件",
    }


# ── enforce_hmac_or_aes() ──

def enforce_hmac_or_aes(component_name: str, field_name: str, value: Any, key_b64: str) -> dict:
    data = json.dumps(value, sort_keys=True, default=str).encode()
    key = base64.b64decode(key_b64)
    hmac_sig = hmac.new(key, data, hashlib.sha256).digest()
    try:
        from cryptography.fernet import Fernet
        fernet = Fernet(base64.b64encode(key[:32]))
        encrypted = fernet.encrypt(data)
        encrypted_b64 = base64.b64encode(encrypted).decode()
    except Exception:
        encrypted_b64 = None
    return {
        "component": component_name,
        "field": field_name,
        "original_type": type(value).__name__,
        "hmac_signature": base64.b64encode(hmac_sig).decode(),
        "aes_encrypted_payload": encrypted_b64,
        "nonce": generate_per_call_nonce(),
        "timestamp": time.time(),
        "verified_by": f"{component_name}::verify_and_unwrap()",
    }


# ─────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print("Usage: pipeline.py <command> [args]")
        print("Commands:")
        print("  analyze <path>         — Run dependency tree analysis")
        print("  split '<requirement>'  — Split requirement into micro-components")
        print("  event [domain] [verb] — Generate event trigger name")
        print("  security decoy [lang] [component]  — Inject decoy vulnerability")
        print("  security scatter                         — Scatter security config")
        print("  security diversify <c1,c2,c3>           — Diversify validation libs")
        print("  security dynamic-key <A> <B>            — Generate dynamic key")
        print("  security sign <key_b64> <value_json>   — Sign payload with HMAC")
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "analyze":
        if len(sys.argv) < 3:
            print("Usage: pipeline.py analyze <path>")
            sys.exit(1)
        report = DependencyAnalyzer(sys.argv[2]).scan().get_report()
        print(json.dumps(report, indent=2, ensure_ascii=False))

    elif cmd == "split":
        if len(sys.argv) < 3:
            print("Usage: pipeline.py split '<requirement>'")
            sys.exit(1)
        result = split_logic_to_micro_files(sys.argv[2])
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif cmd == "event":
        domain = sys.argv[2] if len(sys.argv) > 2 else None
        verb = sys.argv[3] if len(sys.argv) > 3 else None
        print(generate_event_trigger(domain, verb))

    elif cmd == "security":
        if len(sys.argv) < 3:
            print("Usage: pipeline.py security <subcommand> [args]")
            sys.exit(1)
        sub = sys.argv[2]
        if sub == "decoy":
            lang = sys.argv[3] if len(sys.argv) > 3 else "python"
            comp = sys.argv[4] if len(sys.argv) > 4 else "ComponentX"
            print(json.dumps(inject_decoy_vulnerability(lang, comp), indent=2, ensure_ascii=False))
        elif sub == "scatter":
            print(json.dumps(scatter_security_config(), indent=2, ensure_ascii=False))
        elif sub == "diversify":
            components = sys.argv[3].split(",") if len(sys.argv) > 3 else ["A", "B", "C", "D"]
            print(json.dumps(diversify_validation_libs(components), indent=2, ensure_ascii=False))
        elif sub == "dynamic-key":
            a = sys.argv[3] if len(sys.argv) > 3 else "ComponentA"
            b = sys.argv[4] if len(sys.argv) > 4 else "ComponentB"
            print(json.dumps(generate_dynamic_encryption_key(a, b), indent=2, ensure_ascii=False))
        elif sub == "sign":
            if len(sys.argv) < 5:
                print("Usage: pipeline.py security sign <key_b64> <value_json> [component]")
                sys.exit(1)
            key_b64 = sys.argv[3]
            value = json.loads(sys.argv[4])
            comp = sys.argv[5] if len(sys.argv) > 5 else "X"
            print(json.dumps(enforce_hmac_or_aes(comp, "data", value, key_b64), indent=2))
        else:
            print(f"Unknown security subcommand: {sub}")
            sys.exit(1)
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()
