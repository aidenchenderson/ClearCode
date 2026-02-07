"""Firebase Admin: init app, Firestore client, and verify ID tokens from frontend.
Module is named fb_admin to avoid shadowing the firebase_admin package."""
import base64
import json
import os
from pathlib import Path

_firebase_app = None
_db = None


def _resolve_creds_path(creds_path: str) -> str | None:
    """Resolve path to service account JSON. Tries project root, then server dir."""
    path = creds_path.strip().replace("\\", "/").lstrip("/")
    if not path:
        return None
    project_root = Path(__file__).resolve().parent.parent
    server_dir = Path(__file__).resolve().parent
    candidates = [
        Path(path).resolve() if Path(path).is_absolute() else None,
        (project_root / path).resolve(),
        (project_root / path.lstrip("./")).resolve(),
        (server_dir / path).resolve(),
        (server_dir / path.split("/")[-1]).resolve() if "/" in path or "\\" in path else None,
    ]
    for p in candidates:
        if p and p.is_file():
            return str(p)
    if os.path.isfile(creds_path.strip()):
        return os.path.abspath(creds_path.strip())
    return None


def _init_firebase():
    global _firebase_app, _db
    if _firebase_app is not None:
        return _firebase_app
    import logging
    log = logging.getLogger(__name__)
    project_id = (os.environ.get("FIREBASE_PROJECT_ID") or "").strip()
    creds_path_raw = (os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or "").strip()
    creds_path = _resolve_creds_path(creds_path_raw) if creds_path_raw else None
    if creds_path_raw and not creds_path:
        log.warning("Firebase credentials file not found: %s", creds_path_raw)
    if not project_id and not creds_path:
        return None
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if firebase_admin._apps:
            _firebase_app = firebase_admin.get_app()
        else:
            if creds_path:
                cred = credentials.Certificate(creds_path)
                _firebase_app = firebase_admin.initialize_app(cred)
            elif project_id:
                _firebase_app = firebase_admin.initialize_app(options={"projectId": project_id})
            else:
                return None
        _db = firestore.client()
        return _firebase_app
    except Exception as e:
        log.exception("Firebase Admin init failed: %s", e)
        return None


def get_firestore():
    """Return Firestore client if Firebase is configured, else None."""
    if _init_firebase() is None:
        return None
    return _db


def _decode_jwt_payload_unsafe(token: str) -> dict | None:
    """Decode JWT payload without verifying (dev only). Returns payload dict or None."""
    try:
        parts = token.strip().split(".")
        if len(parts) != 3:
            return None
        payload_b64 = parts[1]
        payload_b64 += "=" * (4 - len(payload_b64) % 4)
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        return json.loads(payload_bytes)
    except Exception:
        return None


def verify_id_token(token: str) -> dict | None:
    """Verify a Firebase ID token. Returns decoded claims (with 'uid') or None."""
    if not token or not token.strip():
        return None
    token = token.strip()
    try:
        if _init_firebase() is not None:
            from firebase_admin import auth
            return auth.verify_id_token(token)
    except Exception as e:
        if os.environ.get("FLASK_DEBUG", "").lower() in ("1", "true", "yes"):
            import logging
            logging.getLogger(__name__).warning("Firebase token verification failed: %s", e)
    dev_skip = os.environ.get("DEV_SKIP_TOKEN_VERIFY", "").lower() in ("1", "true", "yes")
    flask_debug = os.environ.get("FLASK_DEBUG", "").lower() in ("1", "true", "yes")
    if (dev_skip or flask_debug):
        payload = _decode_jwt_payload_unsafe(token)
        if payload and payload.get("sub"):
            return {"uid": payload["sub"], **payload}
    return None
