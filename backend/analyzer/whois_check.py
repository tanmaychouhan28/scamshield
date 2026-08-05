from datetime import datetime, timezone

import whois  # python-whois


def _first(value):
    """python-whois sometimes returns a list of dates/strings; normalize to one."""
    if isinstance(value, list):
        return value[0] if value else None
    return value


def _to_utc(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def check_whois(domain: str) -> dict:
    result = {
        "registrar": None,
        "creation_date": None,
        "expiration_date": None,
        "domain_age_days": None,
        "days_until_expiration": None,
        "name_servers": [],
        "registrant_country": None,
        "privacy_protected": None,
        "error": None,
    }
    try:
        w = whois.whois(domain)

        creation = _to_utc(_first(w.creation_date))
        expiration = _to_utc(_first(w.expiration_date))
        now = datetime.now(timezone.utc)

        result["registrar"] = w.registrar
        if creation:
            result["creation_date"] = creation.isoformat()
            result["domain_age_days"] = (now - creation).days
        if expiration:
            result["expiration_date"] = expiration.isoformat()
            result["days_until_expiration"] = (expiration - now).days

        ns = w.name_servers
        if ns:
            result["name_servers"] = sorted({n.lower() for n in ns if n})

        result["registrant_country"] = getattr(w, "country", None)

        org = (w.org or "") + (w.registrant_name or "" if hasattr(w, "registrant_name") else "")
        privacy_markers = ["privacy", "redacted", "whoisguard", "protect", "proxy"]
        result["privacy_protected"] = any(m in (org or "").lower() for m in privacy_markers)

        if not creation and not w.registrar:
            result["error"] = "WHOIS lookup returned no usable data for this domain."
    except Exception as e:
        result["error"] = f"WHOIS lookup failed: {e}"
    return result
