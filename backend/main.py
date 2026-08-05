import json
import sqlite3
import time
import uuid
from contextlib import contextmanager
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analyzer.url_safety import normalize_url, assert_public_host, host_and_port, UnsafeURLError
from analyzer.ssl_check import check_ssl
from analyzer.whois_check import check_whois
from analyzer.dns_check import check_dns
from analyzer.url_heuristics import analyze_url_structure
from analyzer.content_analysis import fetch_page, analyze_content_heuristics, verify_link_resolves
from analyzer.ai_content_analysis import analyze_content_with_llm
from analyzer.risk_engine import compute_risk

DB_PATH = "scamshield.db"

app = FastAPI(title="ScamShield AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@contextmanager
def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS scans (
                id TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                host TEXT NOT NULL,
                score INTEGER NOT NULL,
                label TEXT NOT NULL,
                confidence INTEGER NOT NULL,
                created_at REAL NOT NULL,
                result_json TEXT NOT NULL
            )
            """
        )


init_db()


class ScanRequest(BaseModel):
    url: str
    use_ai_content_analysis: bool = True


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/scan")
def scan(req: ScanRequest):
    try:
        url = normalize_url(req.url)
        host, port = host_and_port(url)
        assert_public_host(host)
    except UnsafeURLError as e:
        raise HTTPException(status_code=400, detail=str(e))

    ssl_r = check_ssl(host, port) if urlparse(url).scheme == "https" else {
        "has_ssl": False, "valid": False, "error": "Site uses plain HTTP, not HTTPS.",
    }
    whois_r = check_whois(host)
    dns_r = check_dns(host)
    url_r = analyze_url_structure(url)
    fetch_r = fetch_page(url)

    content_h = {}
    llm_r = None
    if not fetch_r.get("error"):
        content_h = analyze_content_heuristics(fetch_r["text"], fetch_r["links"])
        if content_h.get("has_privacy_link") and content_h.get("privacy_link"):
            resolves = verify_link_resolves(content_h["privacy_link"], fetch_r["final_url"] or url)
            content_h["privacy_link_resolves"] = resolves
            if resolves is False:  # confirmed dead — not just unreachable-to-verify
                content_h["has_privacy_link"] = False
        if req.use_ai_content_analysis:
            llm_r = analyze_content_with_llm(fetch_r["text"])

    risk = compute_risk(ssl_r, whois_r, dns_r, url_r, content_h, llm_r, fetch_r)

    result = {
        "id": str(uuid.uuid4()),
        "url": url,
        "host": host,
        "scanned_at": time.time(),
        "risk": risk,
        "ssl": ssl_r,
        "whois": whois_r,
        "dns": dns_r,
        "url_structure": url_r,
        "content": content_h,
        "ai_content_analysis": llm_r,
        "page": {
            "final_url": fetch_r.get("final_url"),
            "status_code": fetch_r.get("status_code"),
            "redirected": fetch_r.get("redirected"),
            "title": fetch_r.get("title"),
            "meta_description": fetch_r.get("meta_description"),
            "error": fetch_r.get("error"),
        },
    }

    with db() as conn:
        conn.execute(
            "INSERT INTO scans (id, url, host, score, label, confidence, created_at, result_json) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (result["id"], url, host, risk["score"], risk["label"], risk["confidence"],
             result["scanned_at"], json.dumps(result)),
        )

    return result


@app.get("/api/scan/{scan_id}")
def get_scan(scan_id: str):
    with db() as conn:
        row = conn.execute("SELECT result_json FROM scans WHERE id = ?", (scan_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return json.loads(row["result_json"])


@app.get("/api/history")
def history(limit: int = Query(50, le=200), offset: int = 0, q: str | None = None):
    with db() as conn:
        if q:
            rows = conn.execute(
                "SELECT id, url, host, score, label, confidence, created_at FROM scans "
                "WHERE url LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (f"%{q}%", limit, offset),
            ).fetchall()
            total = conn.execute("SELECT COUNT(*) c FROM scans WHERE url LIKE ?", (f"%{q}%",)).fetchone()["c"]
        else:
            rows = conn.execute(
                "SELECT id, url, host, score, label, confidence, created_at FROM scans "
                "ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, offset),
            ).fetchall()
            total = conn.execute("SELECT COUNT(*) c FROM scans").fetchone()["c"]
    return {"items": [dict(r) for r in rows], "total": total}


@app.get("/api/stats")
def stats():
    with db() as conn:
        total = conn.execute("SELECT COUNT(*) c FROM scans").fetchone()["c"]
        high = conn.execute("SELECT COUNT(*) c FROM scans WHERE label = 'High Risk'").fetchone()["c"]
        med = conn.execute("SELECT COUNT(*) c FROM scans WHERE label = 'Moderate Risk'").fetchone()["c"]
        low = conn.execute("SELECT COUNT(*) c FROM scans WHERE label = 'Low Risk'").fetchone()["c"]
        recent = conn.execute(
            "SELECT id, url, host, score, label, created_at FROM scans ORDER BY created_at DESC LIMIT 10"
        ).fetchall()
    return {
        "total_scans": total,
        "threats_blocked": high,
        "safe_sites": low,
        "moderate_risk": med,
        "risk_distribution": {"high": high, "moderate": med, "low": low},
        "recent_scans": [dict(r) for r in recent],
    }
