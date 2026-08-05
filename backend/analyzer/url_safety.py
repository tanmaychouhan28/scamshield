"""
URL parsing + SSRF guard.

Because this service fetches whatever URL a user submits, it must refuse to
let the server be used as a proxy to reach internal/private infrastructure
(localhost, link-local metadata endpoints, RFC1918 ranges, etc).
"""
import ipaddress
import socket
from urllib.parse import urlparse

BLOCKED_PORTS = {22, 23, 25, 3389, 6379, 5432, 3306, 27017}


class UnsafeURLError(ValueError):
    pass


def normalize_url(raw: str) -> str:
    raw = raw.strip()
    if not raw:
        raise UnsafeURLError("Empty URL.")
    if "://" not in raw:
        raw = "https://" + raw
    parsed = urlparse(raw)
    if parsed.scheme not in ("http", "https"):
        raise UnsafeURLError("Only http:// and https:// URLs are supported.")
    if not parsed.hostname:
        raise UnsafeURLError("URL has no host.")
    return raw


def assert_public_host(hostname: str) -> list[str]:
    """
    Resolve the hostname and reject it if ANY resolved address is private,
    loopback, link-local, reserved, or multicast. Returns the resolved IPs
    on success (useful for hosting-country / infra lookups downstream).
    """
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror as e:
        raise UnsafeURLError(f"Could not resolve host: {hostname}") from e

    ips = sorted({info[4][0] for info in infos})
    if not ips:
        raise UnsafeURLError(f"Could not resolve host: {hostname}")

    for ip_str in ips:
        ip = ipaddress.ip_address(ip_str)
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            raise UnsafeURLError(
                f"Refusing to scan {hostname}: resolves to a non-public address ({ip_str})."
            )
    return ips


def host_and_port(url: str) -> tuple[str, int]:
    parsed = urlparse(url)
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    if port in BLOCKED_PORTS:
        raise UnsafeURLError(f"Refusing to scan restricted port {port}.")
    return parsed.hostname, port
