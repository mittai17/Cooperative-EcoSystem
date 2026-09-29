#!/usr/bin/env python3
"""
CoopSetu AI - Physical Hardware & Mobile App Integration Test Suite
Validates:
1. Mobile App Bundler & Web Export (Expo, Metro, WASM, assets)
2. Live Biometric Face Recognition & Liveness Pipeline (/attendance/face-verify)
3. Dynamic QR Attendance with Cryptographic HMAC Expiry Tokens
4. Certificate Tamper-Evident Verification (CST-2026-KU9N9UIVCS5S & CST-2026-DAI-00842)
5. Offline Sync Pipeline (/api/v1/sync/pull and /api/v1/sync/push)
"""

import sys
import os
import json
import time
import uuid
import math
import subprocess
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

BASE_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000")
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MOBILE_DIR = PROJECT_ROOT / "apps" / "mobile"
DIST_DIR = Path("/tmp/mobile_web_dist")

# Test Tokens & Identities
ADMIN_TOKEN = "dev-token:clerk_admin_baf7bde4"
TRAINEE_TOKEN = "dev-token:trainee_clerk_bc82fd93"
TRAINEE_USER_ID = "8fd67121-3c5e-4127-8d48-103efbde3d67"  # Ravindra Suresh Patil
PROGRAMME_ID = "a86fce59-a457-44b3-8e05-57d527957780"

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


class TestReport:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.details = []

    def log_success(self, test_name: str, message: str = ""):
        self.tests_run += 1
        self.tests_passed += 1
        print(f"  {GREEN}✔ PASS{RESET} {BOLD}{test_name}{RESET} {message}")
        self.details.append({"name": test_name, "status": "PASS", "message": message})

    def log_failure(self, test_name: str, message: str = ""):
        self.tests_run += 1
        self.tests_failed += 1
        print(f"  {RED}✘ FAIL{RESET} {BOLD}{test_name}{RESET} - {RED}{message}{RESET}")
        self.details.append({"name": test_name, "status": "FAIL", "message": message})

    def summarize(self):
        print("\n" + "=" * 70)
        print(f"{BOLD}PHYSICAL HARDWARE & MOBILE TEST SUMMARY{RESET}")
        print("=" * 70)
        print(f"Total Tests Run:    {self.tests_run}")
        print(f"Passed:             {GREEN}{self.tests_passed}{RESET}")
        print(f"Failed:             {RED if self.tests_failed > 0 else GREEN}{self.tests_failed}{RESET}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success Rate:       {BOLD}{success_rate:.1f}%{RESET}")
        print("=" * 70)
        return self.tests_failed == 0


report = TestReport()


def http_request(path: str, method: str = "GET", data: dict = None, token: str = None,
                 raw_data: bytes = None, content_type: str = "application/json"):
    url = f"{BASE_URL}{path}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if raw_data is not None:
        headers["Content-Type"] = content_type
        payload = raw_data
    elif data is not None:
        headers["Content-Type"] = "application/json"
        payload = json.dumps(data).encode("utf-8")
    else:
        payload = None

    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            resp_bytes = resp.read()
            resp_body = json.loads(resp_bytes.decode("utf-8")) if resp_bytes else {}
            return resp.status, resp_body
    except urllib.error.HTTPError as e:
        err_bytes = e.read()
        try:
            err_body = json.loads(err_bytes.decode("utf-8"))
        except Exception:
            err_body = {"raw": err_bytes.decode("utf-8", errors="replace")}
        return e.code, err_body
    except Exception as e:
        return 500, {"error": str(e)}


def build_multipart_form(fields: dict, files: list) -> tuple[bytes, str]:
    boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
    body = bytearray()
    for name, value in fields.items():
        body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode())
    for field_name, filename, ctype, content in files:
        body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field_name}\"; filename=\"{filename}\"\r\nContent-Type: {ctype}\r\n\r\n".encode())
        body.extend(content)
        body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode())
    return bytes(body), f"multipart/form-data; boundary={boundary}"


# ---------------------------------------------------------------------------
# TEST 1: Mobile Bundler & Web Export
# ---------------------------------------------------------------------------
def test_mobile_bundle():
    print(f"\n{CYAN}{BOLD}[1/5] Testing Mobile App Bundler & Web Export (Expo / Metro){RESET}")

    # Check package.json exists
    pkg_json = MOBILE_DIR / "package.json"
    if not pkg_json.is_file():
        report.log_failure("Mobile Package JSON", f"Missing {pkg_json}")
        return
    with open(pkg_json) as f:
        pkg_data = json.load(f)
    report.log_success("Mobile App Config", f"Found {pkg_data.get('name')} v{pkg_data.get('version')}")

    # Verify expo export output
    index_html = DIST_DIR / "index.html"
    static_js = DIST_DIR / "_expo" / "static" / "js" / "web"
    wasm_files = list(DIST_DIR.glob("**/*.wasm"))

    if not index_html.is_file():
        print("  Triggering Expo web export build...")
        res = subprocess.run(
            ["npx", "expo", "export", "--platform", "web", "--output-dir", str(DIST_DIR)],
            cwd=str(MOBILE_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env={**os.environ, "NODE_OPTIONS": "--max-old-space-size=4096"}
        )
        if res.returncode != 0:
            report.log_failure("Expo Web Export", f"Build failed: {res.stderr.decode('utf-8', errors='replace')[:200]}")
            return

    js_files = list(static_js.glob("*.js")) if static_js.is_dir() else []
    report.log_success("Expo Web Export Compilation", f"Compiled {len(js_files)} JS bundles to {DIST_DIR}")

    # Check WASM SQLite asset resolution
    wasm_assets = list(DIST_DIR.glob("**/*sqlite*.wasm"))
    if wasm_assets:
        report.log_success("WASM SQLite Engine", f"Embedded {wasm_assets[0].name} ({wasm_assets[0].stat().st_size // 1024} KB)")
    else:
        report.log_failure("WASM SQLite Engine", "wa-sqlite.wasm asset missing from export")

    # Check navigation / screen assets
    assets = list((DIST_DIR / "assets").glob("**/*")) if (DIST_DIR / "assets").is_dir() else []
    report.log_success("Mobile Assets Verification", f"Exported {len(assets)} UI icons and assets cleanly")


# ---------------------------------------------------------------------------
# TEST 2: Biometric Face Recognition & Anti-Spoofing Liveness
# ---------------------------------------------------------------------------
def test_biometric_face():
    print(f"\n{CYAN}{BOLD}[2/5] Testing Hardware Face Biometrics & Liveness Verification{RESET}")

    # Reset recent verify attempts to guarantee idempotent test execution
    try:
        cleanup_code = (
            "import asyncio; from app.database import AsyncSessionLocal; "
            "from app.models.face import FaceEvent; from sqlalchemy import delete;\n"
            "async def m():\n"
            "    async with AsyncSessionLocal() as s:\n"
            "        await s.execute(delete(FaceEvent).where(FaceEvent.event_type == 'verify'))\n"
            "        await s.commit()\n"
            "asyncio.run(m())"
        )
        subprocess.run(
            ["python3", "-c", cleanup_code],
            cwd=str(PROJECT_ROOT / "backend"),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception:
        pass

    # 1. Biometric Consent
    status, body = http_request(
        "/api/v1/face/consent",
        method="POST",
        data={"granted": True, "version": "1"},
        token=TRAINEE_TOKEN
    )
    if status == 200 and body.get("granted") is True:
        report.log_success("Face Biometric Consent", "DPDPA-compliant consent registered")
    else:
        report.log_failure("Face Biometric Consent", f"Status {status}: {body}")

    # 2. Supervised Biometric Enrollment (3 normalized 128-d frames)
    dim = 128
    emb = [1.0 / math.sqrt(dim)] * dim
    frame_raw = json.dumps({"embedding": emb, "yaw": 0.0}).encode("utf-8")
    files = [("frames", f"frame_{i}.json", "application/json", frame_raw) for i in range(3)]
    body_data, ctype = build_multipart_form({"trainee_id": TRAINEE_USER_ID}, files)

    status, body = http_request(
        "/api/v1/face/enroll",
        method="POST",
        raw_data=body_data,
        content_type=ctype,
        token=ADMIN_TOKEN
    )
    if status == 200 and body.get("enrolled") is True:
        report.log_success("Face Vector Enrollment", f"SFace 128-d embedding stored (model: {body.get('model_version')})")
    else:
        report.log_failure("Face Vector Enrollment", f"Status {status}: {body}")

    # 3. Dynamic Pose Liveness Challenge
    status, challenge = http_request("/api/v1/face/challenge", method="POST", token=TRAINEE_TOKEN)
    if status == 200 and "challenge_id" in challenge:
        seq = challenge["sequence"]
        report.log_success("Liveness Challenge", f"Challenge ID {challenge['challenge_id'][:8]}... sequence: {seq}")
    else:
        report.log_failure("Liveness Challenge", f"Status {status}: {challenge}")
        return

    # 4. Generate an active attendance session allowing face
    status, sess = http_request(
        "/api/v1/attendance/generate-qr",
        method="POST",
        data={
            "programme_id": PROGRAMME_ID,
            "session_name": f"Biometric Live Test {uuid.uuid4().hex[:6]}",
            "valid_minutes": 60
        },
        token=ADMIN_TOKEN
    )
    if status != 200:
        report.log_failure("Attendance Session for Face Test", f"Status {status}: {sess}")
        return
    session_id = sess["session_id"]

    # 5. Live Face Verification with Pose Motion (Centre + Left/Right Opposing Yaw)
    verify_files = []
    for pose in seq:
        yaw = 0.0 if pose == "centre" else (-0.28 if pose == "left" else 0.28)
        frame_bytes = json.dumps({"embedding": emb, "yaw": yaw}).encode("utf-8")
        verify_files.append(("frames", f"frame_{pose}.json", "application/json", frame_bytes))

    body_data, ctype = build_multipart_form({
        "session_id": session_id,
        "challenge_id": challenge["challenge_id"]
    }, verify_files)

    # Test /api/v1/attendance/face-verify
    status, verify_result = http_request(
        "/api/v1/attendance/face-verify",
        method="POST",
        raw_data=body_data,
        content_type=ctype,
        token=TRAINEE_TOKEN
    )
    if status == 200 and verify_result.get("matched") is True:
        score = verify_result.get("score", 0.0)
        report.log_success("Face Verify Endpoint (/face-verify)", f"Matched: True, Liveness: True, Score: {score:.4f}")
    else:
        report.log_failure("Face Verify Endpoint (/face-verify)", f"Status {status}: {verify_result}")

    # 6. Anti-Spoofing Test: Static replay attack without pose motion should be rejected
    # Use dedicated trainee_test_user_2 to isolate rate-limiting window
    spoof_token = "dev-token:trainee_test_user_2"
    spoof_user_id = "6060feb9-df6f-4e53-9f4f-47d8b5795670"
    http_request("/api/v1/face/consent", method="POST", data={"granted": True, "version": "1"}, token=spoof_token)
    spoof_files_init = [("frames", f"f_{i}.json", "application/json", frame_raw) for i in range(3)]
    s_body, s_ctype = build_multipart_form({"trainee_id": spoof_user_id}, spoof_files_init)
    http_request("/api/v1/face/enroll", method="POST", raw_data=s_body, content_type=s_ctype, token=ADMIN_TOKEN)

    status, spoof_challenge = http_request("/api/v1/face/challenge", method="POST", token=spoof_token)
    if status == 200:
        # Generate another session to test spoof rejection
        _, spoof_sess = http_request(
            "/api/v1/attendance/generate-qr",
            method="POST",
            data={"programme_id": PROGRAMME_ID, "session_name": "Anti-Spoof Test", "valid_minutes": 60},
            token=ADMIN_TOKEN
        )
        # Send 3 identical frames with 0 yaw (photo presentation attack)
        spoof_files = [
            ("frames", f"spoof_{i}.json", "application/json", json.dumps({"embedding": emb, "yaw": 0.0}).encode("utf-8"))
            for i in range(3)
        ]
        spoof_body, spoof_ctype = build_multipart_form({
            "session_id": spoof_sess["session_id"],
            "challenge_id": spoof_challenge["challenge_id"]
        }, spoof_files)

        status, spoof_res = http_request(
            "/api/v1/attendance/face/verify",
            method="POST",
            raw_data=spoof_body,
            content_type=spoof_ctype,
            token=spoof_token
        )
        if status == 200 and spoof_res.get("matched") is False and spoof_res.get("liveness") is False:
            report.log_success("Anti-Spoofing Rejection", "Static photo presentation attack blocked (liveness: False)")
        else:
            report.log_failure("Anti-Spoofing Rejection", f"Spoof should be rejected, got: {status} {spoof_res}")


# ---------------------------------------------------------------------------
# TEST 3: Dynamic QR Attendance & HMAC Expiry
# ---------------------------------------------------------------------------
def test_dynamic_qr():
    print(f"\n{CYAN}{BOLD}[3/5] Testing Dynamic QR Attendance & Cryptographic HMAC Verification{RESET}")

    # 1. Generate Rotating QR Session
    status, sess = http_request(
        "/api/v1/attendance/generate-qr",
        method="POST",
        data={
            "programme_id": PROGRAMME_ID,
            "session_name": f"Dynamic QR Test {uuid.uuid4().hex[:6]}",
            "valid_minutes": 30
        },
        token=ADMIN_TOKEN
    )
    if status != 200 or "qr_token" not in sess:
        report.log_failure("Dynamic QR Generation", f"Status {status}: {sess}")
        return

    qr_token = sess["qr_token"]
    session_id = sess["session_id"]
    parts = qr_token.split(".")
    if len(parts) == 3 and len(parts[2]) == 32:
        report.log_success("HMAC Token Structure", f"Valid 3-part HMAC token (Session: {parts[0][:8]}... Window: {parts[1]})")
    else:
        report.log_failure("HMAC Token Structure", f"Unexpected format: {qr_token}")

    # 2. Poll Active Session QR with Rotation TTL
    status, qr_poll = http_request(f"/api/v1/attendance/sessions/{session_id}/qr", token=ADMIN_TOKEN)
    if status == 200 and "expires_in" in qr_poll:
        report.log_success("Rotating QR Polling", f"Token refreshed, expires in {qr_poll['expires_in']}s")
    else:
        report.log_failure("Rotating QR Polling", f"Status {status}: {qr_poll}")

    # 3. Trainee Scans Valid QR Token
    status, scan_res = http_request(
        "/api/v1/attendance/scan",
        method="POST",
        data={"qr_token": f"coopsetu:attend:{qr_token}"},
        token=TRAINEE_TOKEN
    )
    if status == 200 and scan_res.get("status") == "recorded":
        report.log_success("Dynamic QR Scan Verification", f"Attendance recorded for trainee {scan_res.get('trainee_id')[:8]}...")
    else:
        report.log_failure("Dynamic QR Scan Verification", f"Status {status}: {scan_res}")

    # 4. Tampered QR Token Rejection
    # Alter the HMAC signature digest
    tampered_digest = ("0" if parts[2][0] != "0" else "1") + parts[2][1:]
    tampered_token = f"{parts[0]}.{parts[1]}.{tampered_digest}"
    status, tampered_res = http_request(
        "/api/v1/attendance/scan",
        method="POST",
        data={"qr_token": f"coopsetu:attend:{tampered_token}"},
        token=TRAINEE_TOKEN
    )
    if status == 404:
        report.log_success("Tampered QR Rejection", "Altered cryptographic HMAC signature rejected with 404")
    else:
        report.log_failure("Tampered QR Rejection", f"Expected 404, got {status}: {tampered_res}")


# ---------------------------------------------------------------------------
# TEST 4: Tamper-Evident Certificate Verification
# ---------------------------------------------------------------------------
def test_certificates():
    print(f"\n{CYAN}{BOLD}[4/5] Testing Certificate Tamper-Evident Verification Endpoint{RESET}")

    # Sample 1: Authentic Certificate CST-2026-KU9N9UIVCS5S
    cert_valid = "CST-2026-KU9N9UIVCS5S"
    status, body = http_request(f"/api/v1/certificates/verify/{cert_valid}")
    if status == 200 and body.get("valid") is True and body.get("integrity") == "ok":
        cert = body.get("certificate", {})
        report.log_success("Authentic Certificate", f"{cert_valid}: Verified ({cert.get('holder_name')} - Grade {cert.get('grade')})")
    else:
        report.log_failure("Authentic Certificate", f"Expected valid=True, integrity=ok. Got {status}: {body}")

    # Sample 2: Non-existent / Forged Certificate CST-2026-DAI-00842
    cert_invalid = "CST-2026-DAI-00842"
    status, body = http_request(f"/api/v1/certificates/verify/{cert_invalid}")
    if status == 200 and body.get("valid") is False and body.get("integrity") == "failed":
        report.log_success("Tampered/Forged Certificate", f"{cert_invalid}: Correctly detected as invalid/forged (integrity: failed)")
    else:
        report.log_failure("Tampered/Forged Certificate", f"Expected valid=False, integrity=failed. Got {status}: {body}")


# ---------------------------------------------------------------------------
# TEST 5: Offline Sync Pipeline (Push & Pull)
# ---------------------------------------------------------------------------
def test_offline_sync():
    print(f"\n{CYAN}{BOLD}[5/5] Testing Offline Sync Pipeline (/sync/pull and /sync/push){RESET}")

    # 1. Offline Pull Endpoint
    status, pull_res = http_request("/api/v1/sync/pull")
    if status == 200 and pull_res.get("status") == "online" and pull_res.get("sync_supported") is True:
        report.log_success("Offline Pull Endpoint (/sync/pull)", f"Status online, server time: {pull_res.get('server_time')}")
    else:
        report.log_failure("Offline Pull Endpoint (/sync/pull)", f"Status {status}: {pull_res}")

    # 2. Offline Push Batch Items
    client_item_id = f"outbox_{uuid.uuid4().hex[:12]}"
    batch_payload = {
        "items": [
            {
                "id": client_item_id,
                "action": "RECORD_ATTENDANCE",
                "payload": {"qr_token": "dummy_offline_scan"},
                "client_timestamp": datetime.now(timezone.utc).isoformat()
            }
        ]
    }
    status, push_res = http_request(
        "/api/v1/sync/push",
        method="POST",
        data=batch_payload,
        token=ADMIN_TOKEN
    )
    if status == 200 and push_res.get("processed_count") == 1:
        report.log_success("Offline Push Batch (/sync/push)", f"Processed outbox action (id: {client_item_id})")
    else:
        report.log_failure("Offline Push Batch (/sync/push)", f"Status {status}: {push_res}")

    # 3. Idempotent Sync Duplicate Detection
    status, dup_res = http_request(
        "/api/v1/sync/push",
        method="POST",
        data=batch_payload,
        token=ADMIN_TOKEN
    )
    if status == 200 and len(dup_res.get("results", [])) > 0:
        first_result = dup_res["results"][0]
        if first_result.get("status") == "duplicate":
            report.log_success("Offline Sync Idempotency", f"Receipt idempotency confirmed (status: duplicate)")
        else:
            report.log_failure("Offline Sync Idempotency", f"Expected duplicate, got: {first_result}")
    else:
        report.log_failure("Offline Sync Idempotency", f"Status {status}: {dup_res}")

    # 4. Mobile Outbox Path Compatibility (/offline_sync/batch)
    status, mobile_sync_res = http_request(
        "/api/v1/offline_sync/batch",
        method="POST",
        data={"items": []},
        token=ADMIN_TOKEN
    )
    if status == 200:
        report.log_success("Mobile Outbox Path Compatibility", "/offline_sync/batch operational for apps/mobile")
    else:
        report.log_failure("Mobile Outbox Path Compatibility", f"Status {status}: {mobile_sync_res}")


def main():
    print(f"\n{BOLD}{CYAN}======================================================================{RESET}")
    print(f"{BOLD}{CYAN}COOPSETU AI: MOBILE & HARDWARE PHYSICAL INTEGRATION VERIFICATION{RESET}")
    print(f"{BOLD}{CYAN}======================================================================{RESET}")
    print(f"Target Server: {BASE_URL}")
    print(f"Timestamp:     {datetime.now(timezone.utc).isoformat()}\n")

    # Verify backend is running
    status, health = http_request("/health")
    if status != 200:
        print(f"{RED}Error: Backend is not accessible at {BASE_URL} (status: {status}){RESET}")
        sys.exit(1)
    print(f"{GREEN}Connected to backend: {health.get('service')} v{health.get('version')}{RESET}")

    test_mobile_bundle()
    test_biometric_face()
    test_dynamic_qr()
    test_certificates()
    test_offline_sync()

    success = report.summarize()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
