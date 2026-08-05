import re

import requests
from bs4 import BeautifulSoup

USER_AGENT = "ScamShieldAI-Scanner/1.0 (+https://example.com/bot)"

URGENCY_PHRASES = [
    "act now", "limited time", "hurry", "only a few left", "expires soon",
    "last chance", "offer ends", "don't miss out", "while supplies last",
    "verify your account immediately", "your account will be suspended",
    "urgent action required", "click here immediately", "final notice",
]

PAYMENT_PRESSURE_PHRASES = [
    "wire transfer only", "gift card payment", "crypto only", "bitcoin only",
    "no refunds", "payment must be sent immediately", "send payment now",
]

CONTACT_PATTERNS = {
    "email": re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"),
    "phone": re.compile(r"(\+?\d[\d\-\s\(\)]{7,}\d)"),
}


def fetch_page(url: str, timeout: float = 8.0) -> dict:
    result = {
        "final_url": None,
        "status_code": None,
        "redirected": False,
        "title": None,
        "meta_description": None,
        "text": "",
        "links": [],
        "error": None,
    }
    try:
        resp = requests.get(
            url,
            timeout=timeout,
            headers={"User-Agent": USER_AGENT},
            allow_redirects=True,
            stream=False,
        )
        result["final_url"] = resp.url
        result["status_code"] = resp.status_code
        result["redirected"] = resp.url != url

        content_type = resp.headers.get("content-type", "")
        if "text/html" not in content_type:
            result["error"] = f"Response was not HTML (content-type: {content_type or 'unknown'})"
            return result

        soup = BeautifulSoup(resp.text[:2_000_000], "html.parser")
        result["title"] = soup.title.string.strip() if soup.title and soup.title.string else None

        meta = soup.find("meta", attrs={"name": "description"})
        result["meta_description"] = meta.get("content", "").strip() if meta else None

        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)
        result["text"] = text[:20_000]

        result["links"] = [a.get("href", "") for a in soup.find_all("a", href=True)][:200]

    except requests.exceptions.SSLError as e:
        result["error"] = f"SSL error while fetching page: {e}"
    except requests.exceptions.Timeout:
        result["error"] = "Request timed out while fetching the page."
    except requests.exceptions.TooManyRedirects:
        result["error"] = "Too many redirects."
    except requests.exceptions.RequestException as e:
        result["error"] = f"Could not fetch page: {e}"
    return result


def analyze_content_heuristics(text: str, links: list[str]) -> dict:
    """
    Lightweight, transparent, keyword/pattern-based signals. These are
    intentionally simple and explainable — they are NOT a claim of true
    NLP scam classification. Pair with analyze_content_with_llm() for a
    materially more accurate read when an API key is configured.
    """
    lower = text.lower()

    urgency_hits = [p for p in URGENCY_PHRASES if p in lower]
    payment_hits = [p for p in PAYMENT_PRESSURE_PHRASES if p in lower]

    has_email = bool(CONTACT_PATTERNS["email"].search(text))
    has_phone = bool(CONTACT_PATTERNS["phone"].search(text))

    privacy_link = next((l for l in links if "privacy" in l.lower()), None)
    terms_link = next((l for l in links if "terms" in l.lower() or "tos" in l.lower()), None)

    exclamations = text.count("!")
    words = max(1, len(text.split()))
    exclamation_ratio = exclamations / words

    caps_words = [w for w in text.split() if len(w) > 3 and w.isupper()]
    caps_ratio = len(caps_words) / words

    return {
        "urgency_phrases_found": urgency_hits,
        "payment_pressure_phrases_found": payment_hits,
        "has_visible_email": has_email,
        "has_visible_phone": has_phone,
        "has_privacy_link": privacy_link is not None,
        "has_terms_link": terms_link is not None,
        "privacy_link": privacy_link,
        "exclamation_ratio": round(exclamation_ratio, 4),
        "excessive_exclamations": exclamation_ratio > 0.01,
        "all_caps_word_ratio": round(caps_ratio, 4),
        "excessive_caps": caps_ratio > 0.02,
        "word_count": words,
    }


def verify_link_resolves(url: str, base_url: str, timeout: float = 5.0) -> bool | None:
    """
    Follow a relative/absolute link (e.g. the privacy policy) and confirm it
    doesn't 404/dead-end.

    Returns:
        True  -> confirmed reachable (status < 400)
        False -> confirmed dead (server responded 404 / not-found)
        None  -> unknown (network error, timeout, or a non-404 4xx/5xx like
                 401/403/429/503) — those status codes are frequently a bot
                 wall (Cloudflare, WAF, rate limiting) rather than evidence
                 the page doesn't exist, and a check that can't reach a
                 third-party/CDN domain is not evidence the link is fake.
                 Callers must treat None as "don't penalize", not a red flag.
    """
    from urllib.parse import urljoin
    try:
        full = urljoin(base_url, url)
        resp = requests.head(full, timeout=timeout, allow_redirects=True, headers={"User-Agent": USER_AGENT})
        if resp.status_code >= 400:
            resp = requests.get(full, timeout=timeout, allow_redirects=True, headers={"User-Agent": USER_AGENT})
        if resp.status_code == 404:
            return False
        if resp.status_code < 400:
            return True
        return None  # ambiguous (403/429/503/etc.) — don't treat as dead
    except requests.exceptions.RequestException:
        return None
