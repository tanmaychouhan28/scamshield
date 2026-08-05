import re
from urllib.parse import urlparse

SUSPICIOUS_TLDS = {
    "zip", "top", "xyz", "click", "loan", "work", "gq", "tk", "ml", "cf", "ga",
    "quest", "rest", "cyou", "mom", "monster", "cam", "buzz",
}

BRAND_KEYWORDS = [
    "amazon", "paypal", "apple", "google", "microsoft", "netflix", "bank",
    "facebook", "instagram", "irs", "usps", "fedex", "dhl", "chase", "wellsfargo",
]

IP_HOST_RE = re.compile(r"^(\d{1,3}\.){3}\d{1,3}$")


def analyze_url_structure(url: str) -> dict:
    parsed = urlparse(url)
    host = parsed.hostname or ""
    labels = host.split(".")
    tld = labels[-1].lower() if len(labels) > 1 else ""
    registrable = ".".join(labels[-2:]) if len(labels) >= 2 else host

    flags = []

    is_ip_host = bool(IP_HOST_RE.match(host))
    if is_ip_host:
        flags.append("Host is a raw IP address rather than a domain name")

    if host.startswith("xn--") or any(l.startswith("xn--") for l in labels):
        flags.append("Domain uses punycode — may be a lookalike of a real brand")

    subdomain_count = max(0, len(labels) - 2)
    if subdomain_count >= 3:
        flags.append(f"Unusually deep subdomain chain ({subdomain_count} levels)")

    hyphen_count = registrable.count("-")
    if hyphen_count >= 2:
        flags.append("Multiple hyphens in the domain name, common in impersonation domains")

    if tld in SUSPICIOUS_TLDS:
        flags.append(f"Uses a top-level domain ('.{tld}') frequently abused for scam sites")

    if parsed.scheme != "https":
        flags.append("Site is not served over HTTPS")

    if len(host) > 40:
        flags.append("Unusually long domain name")

    brand_hit = None
    for brand in BRAND_KEYWORDS:
        if brand in host.replace("-", "") and not host.replace("-", "").startswith(brand + "."):
            # brand keyword present but this isn't the brand's own root domain
            if not host.endswith("." + brand + ".com") and host != f"{brand}.com":
                brand_hit = brand
                flags.append(f"Contains the brand name '{brand}' but is not that brand's official domain")
                break

    return {
        "host": host,
        "registrable_domain": registrable,
        "tld": tld,
        "is_ip_host": is_ip_host,
        "subdomain_count": subdomain_count,
        "uses_https": parsed.scheme == "https",
        "brand_impersonation_hit": brand_hit,
        "flags": flags,
    }
