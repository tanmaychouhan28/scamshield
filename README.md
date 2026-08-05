# ScamShield AI — Full Stack

A real, working scam-site scanner: a Python/FastAPI backend that performs
live SSL/WHOIS/DNS/content checks, and a React frontend (landing page +
dashboard + scan-result report) that calls it. No mocked data anywhere —
every number on screen comes from an actual check the backend ran.

```
scamshield/
  backend/     FastAPI service — the real scanning logic (see backend/README.md)
  frontend/    Vite + React + Tailwind app — landing page, dashboard, scan report
```

## Run it

**1. Backend**

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# optional, meaningfully improves content-analysis accuracy:
export ANTHROPIC_API_KEY=sk-ant-...

uvicorn main:app --reload --port 8000
```

**2. Frontend** (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The landing page's live-scan section calls
your local backend directly — try scanning any real site.

## What's real vs. what to know

- **Every backend check is real** — I ran it against live domains while
  building this (see `backend/README.md` for the exact test transcripts and
  a bug I caught and fixed: an overly aggressive "dead link" check that was
  flagging real, working privacy-policy pages).
- **"Accuracy" claim, honestly stated**: this is a transparent, weighted
  heuristic engine with per-signal explanations and a confidence score —
  not a model with a benchmarked precision/recall. See `backend/README.md`
  → "On accuracy" for what would be needed to go further (a labeled
  scam/legit dataset to tune the weights against).
- **The AI content-analysis pass is optional** and requires
  `ANTHROPIC_API_KEY`. Without it, the engine still runs on eight other
  signal categories — it just won't catch paraphrased manipulation or judge
  whether copy reads as AI-generated boilerplate.
- **What's NOT included**: user accounts/auth, PDF/CSV export, a browser
  extension, and payment processing for the pricing tiers shown on the
  landing page — those are marketing-page content, not wired to anything.
  Everything scan-related (the actual product) is fully functional.

## Deploying

- Backend: any host that gives you a normal outbound network (Render,
  Railway, Fly.io, a VPS). It needs real outbound access on port 43 (WHOIS)
  and 443 (SSL checks) — a restrictive corporate/sandboxed network will
  cause those two checks to time out gracefully (lower confidence, not a
  crash).
- Frontend: `npm run build` → deploy `frontend/dist` anywhere static
  (Vercel, Netlify, Cloudflare Pages). Set `VITE_API_URL` to your deployed
  backend's URL before building.
- Update the CORS `allow_origins` list in `backend/main.py` to your real
  frontend domain before going to production — right now it only allows
  `localhost:5173`.
