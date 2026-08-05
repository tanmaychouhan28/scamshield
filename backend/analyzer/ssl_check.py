import ssl
import socket
from datetime import datetime, timezone


def check_ssl(hostname: str, port: int = 443, timeout: float = 6.0) -> dict:
    """
    Opens a real TLS connection and inspects the certificate the server
    actually presents. Returns a structured result; never raises for the
    "no SSL" case (that is itself a signal, not an error).
    """
    result = {
        "has_ssl": False,
        "valid": False,
        "issuer": None,
        "subject": None,
        "protocol": None,
        "not_before": None,
        "not_after": None,
        "days_until_expiry": None,
        "self_signed": False,
        "error": None,
    }
    ctx = ssl.create_default_context()
    try:
        with socket.create_connection((hostname, port), timeout=timeout) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                result["has_ssl"] = True
                result["valid"] = True
                result["protocol"] = ssock.version()

                issuer = dict(x[0] for x in cert.get("issuer", []))
                subject = dict(x[0] for x in cert.get("subject", []))
                result["issuer"] = issuer.get("organizationName") or issuer.get("commonName")
                result["subject"] = subject.get("commonName")
                result["self_signed"] = issuer.get("commonName") == subject.get("commonName")

                not_before = cert.get("notBefore")
                not_after = cert.get("notAfter")
                if not_before:
                    result["not_before"] = _parse_cert_date(not_before)
                if not_after:
                    dt = _parse_cert_date(not_after)
                    result["not_after"] = dt
                    if dt:
                        delta = datetime.fromisoformat(dt) - datetime.now(timezone.utc)
                        result["days_until_expiry"] = delta.days
    except ssl.SSLCertVerificationError as e:
        # Connected, but the cert is untrusted / self-signed / expired / hostname mismatch.
        result["has_ssl"] = True
        result["valid"] = False
        result["error"] = f"Certificate not trusted: {e.verify_message if hasattr(e, 'verify_message') else str(e)}"
    except (socket.timeout, TimeoutError):
        result["error"] = "Connection timed out while checking SSL."
    except (ConnectionRefusedError, OSError) as e:
        result["error"] = f"Could not establish a TLS connection: {e}"
    except Exception as e:  # defensive: never let a cert quirk crash the scan
        result["error"] = f"Unexpected SSL error: {e}"
    return result


def _parse_cert_date(raw: str) -> str | None:
    try:
        dt = datetime.strptime(raw, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
        return dt.isoformat()
    except ValueError:
        return None
