#!/usr/bin/env python3
"""Run on the server after startup. Creates and removes one temporary teacher.

Passwords and tokens are read locally, kept in memory and never printed.
"""
import base64
import io
import json
from pathlib import Path
import urllib.error
import urllib.request
import uuid
import zipfile

base = "http://127.0.0.1:8090"
env_path = Path(__file__).resolve().parent / ".env.production"
settings = dict(line.split("=", 1) for line in env_path.read_text().splitlines()
                if line and not line.startswith("#") and "=" in line)
token = None


def request(path, method="GET", payload=None, content_type="application/json"):
    headers = {"Content-Type": content_type}
    if token:
        headers["Authorization"] = "Bearer " + token
    data = payload if isinstance(payload, bytes) else json.dumps(payload).encode() if payload is not None else None
    with urllib.request.urlopen(urllib.request.Request(base + path, data=data, method=method, headers=headers), timeout=40) as response:
        body = response.read()
        return json.loads(body) if "application/json" in response.headers.get("Content-Type", "") and body else body


auth = request("/api/auth/login", "POST", {
    "login": settings["ADMIN_USERNAME"], "password": settings["ADMIN_PASSWORD"]})
token = auth["access_token"]
assert request("/api/auth/me")["role"] == "ADMIN"
print("OK administrator login and role")
request("/api/reports/personnel-summary")
for route in ("/api/reports/kpk-summary.xlsx", "/api/reports/retakes.xlsx"):
    with zipfile.ZipFile(io.BytesIO(request(route))) as workbook:
        assert "xl/workbook.xml" in workbook.namelist()
    print("OK " + route)

teacher_id = None
try:
    suffix = uuid.uuid4().hex[:12]
    positions = request("/api/positions")["positions"]
    teacher = request("/api/teachers", "POST", {
        "last_name": "Проверка", "first_name": "Развёртывания",
        "email": f"deploy-{suffix}@edu.mirea.ru", "tg_username": f"deploy_{suffix}",
        "position": positions[0]["name"], "academic_titles": [], "academic_degrees": [], "educations": []})
    teacher_id = teacher["id"]
    photo = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFz8AAAAASUVORK5CYII=")
    boundary = "deployment-" + suffix
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="check.png"\r\n'
            'Content-Type: image/png\r\n\r\n').encode() + photo + f"\r\n--{boundary}--\r\n".encode()
    request(f"/api/teachers/{teacher_id}/photo", "POST", body, f"multipart/form-data; boundary={boundary}")
    assert request(f"/api/teachers/{teacher_id}/photo") == photo
    print("OK teacher creation, photo upload and download (persistent volume writable)")
finally:
    if teacher_id is not None:
        request(f"/api/teachers/{teacher_id}", "DELETE")
        print("Temporary teacher removed")

print("API verification passed; no credentials were printed.")
