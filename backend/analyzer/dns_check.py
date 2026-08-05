import dns.resolver


def check_dns(domain: str) -> dict:
    result = {"a_records": [], "mx_records": [], "txt_records": [], "has_spf": False, "error": None}
    resolver = dns.resolver.Resolver()
    resolver.timeout = 4
    resolver.lifetime = 4
    try:
        try:
            result["a_records"] = [r.to_text() for r in resolver.resolve(domain, "A")]
        except Exception:
            pass
        try:
            result["mx_records"] = [r.exchange.to_text().rstrip(".") for r in resolver.resolve(domain, "MX")]
        except Exception:
            pass
        try:
            txts = [b"".join(r.strings).decode(errors="ignore") for r in resolver.resolve(domain, "TXT")]
            result["txt_records"] = txts
            result["has_spf"] = any(t.lower().startswith("v=spf1") for t in txts)
        except Exception:
            pass
    except Exception as e:
        result["error"] = str(e)
    return result
