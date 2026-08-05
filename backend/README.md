# ScamShield AI — Backend

A real FastAPI service that scans a URL and returns an explainable risk score.
No mocked data — every field comes from a live check the server performs when
you call `/api/scan`.

## What it actually checks

| Signal | How | File |
|---|---|---|
| SSL/TLS | Opens a real TLS socket to the host, inspects the certificate chain, issuer, expiry | `analyzer/ssl_check.py` |
| WHOIS | Real WHOIS lookup — domain age, registrar, expiry | `analyzer/whois_check.py` |
| DNS | A/MX/TXT records, SPF presence | `analyzer/dns_check.py` |
| URL structure | IP-as-host, punycode, suspicious TLDs, brand-impersonation patterns, hyphens, subdomain depth | `analyzer/url_heuristics.py` |
| Page content | Fetches the real page, extracts text, checks urgency/payment-pressure language, missing contact info, dead privacy-policy links | `analyzer/content_analysis.py` |
| AI content read (optional) | Sends page text to Claude for urgency/AI-generated-copy/grammar scoring — catches paraphrased manipulation that keyword lists miss | `analyzer/ai_content_analysis.py` |
| Fusion | Combines every signal into one 0–100 score with per-reason point breakdown and a **confidence** figure that drops when checks fail/timeout | `analyzer/risk_engine.py` |

## On "accuracy"

Be clear-eyed about what this is: a **transparent, multi-signal heuristic
engine**, not a trained scam-classification model with a measured
precision/recall on a labeled dataset. Nobody can honestly promise a fixed
"% accurate" without that kind of evaluation. What this backend *does* give
you, which most simple checkers don't:

- **Every point is explained.** No black-box score.
- **Confidence is reported separately from risk.** A site with mostly-failed
  checks gets a low-confidence score, not a falsely-confident one.
- **Weak signals are capped.** No single check (e.g. "uses WHOIS privacy")
  can push a score into "high risk" alone.
- **The optional Claude pass** materially improves the content signals over
  keyword-matching, because it can catch paraphrased urgency language and
  judge whether copy reads as templated/AI-generated — set `ANTHROPIC_API_KEY`
  to enable it (`use_ai_content_analysis: true` in the request, on by default).

If you want to push accuracy further, the natural next step is collecting a
labeled set of known-scam vs. known-legitimate sites and tuning the weights
in `risk_engine.py` against it — the code is structured so every weight is
in one place, on purpose.

## Setup

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# optional, for the AI content-analysis pass:
export ANTHROPIC_API_KEY=sk-ant-...

uvicorn main:app --reload --port 8000
```

API docs (interactive): http://localhost:8000/docs

### Endpoints

- `POST /api/scan` — `{ "url": "https://example.com", "use_ai_content_analysis": true }`
- `GET /api/scan/{id}` — retrieve a past scan
- `GET /api/history?limit=&q=` — scan history, optional URL search
- `GET /api/stats` — dashboard summary (totals, risk distribution, recent scans)
- `GET /api/health`

Scans are stored in `scamshield.db` (SQLite, created automatically).

## Security notes

- **SSRF guard**: every submitted URL is resolved and rejected if it points
  at a private/loopback/link-local/reserved IP (`analyzer/url_safety.py`).
  Without this, the scanner itself becomes a tool for probing internal
  infrastructure or cloud metadata endpoints.
- Restricted ports (SSH, DB ports, etc.) are refused.
- The page fetcher sends a real identifying User-Agent and caps how much
  HTML it reads (2 MB) so a malicious page can't exhaust server memory.

## Known limitation in sandboxed/restricted networks

WHOIS uses raw TCP on port 43, and some SSL checks open raw sockets — if
you run this behind an HTTP-only egress proxy or firewall, those two checks
will time out and report `"error"` (the engine handles this gracefully and
lowers confidence rather than crashing). In a normal server environment
with outbound internet access, all checks run fine.
