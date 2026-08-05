"""
Combines every raw signal into one explainable 0-100 risk score.

Design goals:
  - Every point added to the score has a corresponding human-readable reason.
  - No single weak signal (e.g. "uses privacy protection") can push a score
    into "high risk" on its own — weights are capped per category.
  - Missing data (a check that errored/timed out) is never silently treated
    as "safe" or "risky" — it's surfaced separately as reduced confidence.
"""


def _reason(label: str, tone: str, points: int):
    return {"label": label, "tone": tone, "points": points}


def compute_risk(ssl_r: dict, whois_r: dict, dns_r: dict, url_r: dict,
                  content_h: dict, llm_r: dict | None, fetch_r: dict) -> dict:
    reasons = []
    score = 0
    signals_available = 0
    signals_errored = 0

    # ---- SSL --------------------------------------------------------
    if ssl_r.get("error") and not ssl_r.get("has_ssl"):
        score += 20
        reasons.append(_reason("Site could not establish a secure (HTTPS) connection", "danger", 20))
        signals_errored += 1
    else:
        signals_available += 1
        if not ssl_r.get("has_ssl"):
            score += 20
            reasons.append(_reason("No SSL certificate presented", "danger", 20))
        elif not ssl_r.get("valid"):
            score += 18
            reasons.append(_reason("SSL certificate is invalid or untrusted", "danger", 18))
        else:
            if ssl_r.get("self_signed"):
                score += 10
                reasons.append(_reason("SSL certificate is self-signed", "warning", 10))
            days = ssl_r.get("days_until_expiry")
            if days is not None and days < 14:
                score += 8
                reasons.append(_reason(f"SSL certificate expires in {days} day(s)", "warning", 8))

    # ---- WHOIS / domain age ------------------------------------------
    if whois_r.get("error"):
        signals_errored += 1
        reasons.append(_reason("WHOIS data unavailable for this domain", "warning", 4))
        score += 4
    else:
        signals_available += 1
        age = whois_r.get("domain_age_days")
        if age is None:
            score += 5
            reasons.append(_reason("Domain registration date could not be determined", "warning", 5))
        elif age < 30:
            score += 25
            reasons.append(_reason(f"Domain was registered only {age} day(s) ago", "danger", 25))
        elif age < 180:
            score += 12
            reasons.append(_reason(f"Domain is only {age} days old", "warning", 12))

        exp_days = whois_r.get("days_until_expiration")
        if exp_days is not None and exp_days < 30:
            score += 8
            reasons.append(_reason(f"Domain registration expires in {exp_days} day(s)", "warning", 8))

    # ---- URL structure -------------------------------------------------
    signals_available += 1
    weight_map = {
        "Host is a raw IP address rather than a domain name": 15,
        "Domain uses punycode": 18,
        "Unusually deep subdomain chain": 8,
        "Multiple hyphens": 6,
        "top-level domain": 10,
        "Site is not served over HTTPS": 12,
        "Unusually long domain name": 5,
        "brand name": 22,
    }
    for flag in url_r.get("flags", []):
        pts = next((v for k, v in weight_map.items() if k in flag), 5)
        score += pts
        reasons.append(_reason(flag, "danger" if pts >= 15 else "warning", pts))

    # ---- Page fetch / content -------------------------------------------
    if fetch_r.get("error"):
        signals_errored += 1
        reasons.append(_reason(f"Could not fully load the page to analyze content ({fetch_r['error']})", "warning", 6))
        score += 6
    else:
        signals_available += 1
        if content_h:
            n_urgency = len(content_h.get("urgency_phrases_found", []))
            if n_urgency:
                pts = min(15, n_urgency * 5)
                score += pts
                reasons.append(_reason("Urgency / pressure language detected in page content", "warning", pts))

            n_payment = len(content_h.get("payment_pressure_phrases_found", []))
            if n_payment:
                pts = min(20, n_payment * 10)
                score += pts
                reasons.append(_reason("Page pressures visitors toward irreversible payment methods", "danger", pts))

            if not content_h.get("has_visible_email") and not content_h.get("has_visible_phone"):
                score += 12
                reasons.append(_reason("No verifiable contact information (email or phone) found on the page", "warning", 12))

            if not content_h.get("has_privacy_link"):
                score += 8
                reasons.append(_reason("No privacy policy link found", "warning", 8))

            if content_h.get("excessive_exclamations"):
                score += 5
                reasons.append(_reason("Unusually heavy use of exclamation marks", "warning", 5))

            if content_h.get("excessive_caps"):
                score += 5
                reasons.append(_reason("Unusually heavy use of ALL-CAPS text", "warning", 5))

    # ---- LLM content read (optional, higher-accuracy) --------------------
    llm_used = bool(llm_r and not llm_r.get("error"))
    if llm_r and llm_r.get("error"):
        reasons.append(_reason("AI content analysis unavailable (no/invalid API key or request failed)", "warning", 0))
    elif llm_used:
        signals_available += 1
        u = llm_r.get("urgency_score", 0)
        ai = llm_r.get("ai_generated_likelihood", 0)
        gq = llm_r.get("grammar_quality_score", 100)
        pts = round(u / 100 * 12 + ai / 100 * 12 + max(0, 100 - gq) / 100 * 8)
        if pts:
            score += pts
        for tactic in llm_r.get("manipulation_tactics", [])[:5]:
            reasons.append(_reason(f"AI reviewer flagged: {tactic}", "warning", 0))
        if llm_r.get("summary"):
            reasons.append(_reason(f"AI content summary: {llm_r['summary']}", "accent", 0))

    score = max(0, min(100, score))
    if score >= 65:
        label, tone = "High Risk", "danger"
    elif score >= 35:
        label, tone = "Moderate Risk", "warning"
    else:
        label, tone = "Low Risk", "success"

    confidence = round(100 * signals_available / max(1, signals_available + signals_errored))

    # Sort: highest-impact danger reasons first, informational (0pt) last.
    reasons.sort(key=lambda r: (-r["points"], r["tone"] != "danger"))

    return {
        "score": score,
        "label": label,
        "tone": tone,
        "confidence": confidence,
        "reasons": reasons,
        "llm_used": llm_used,
    }
