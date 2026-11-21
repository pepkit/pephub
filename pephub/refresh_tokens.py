import hashlib
import json
import os
import secrets
import threading
import time
from typing import Optional

REFRESH_TOKEN_TTL = 60 * 24 * 60 * 60  # 60 days idle, renewed on every use


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class RefreshTokenStore:
    """
    Server-side store of device-login refresh tokens. Only SHA-256 hashes are
    kept. Tokens rotate on use; presenting an already-used token revokes the
    whole family (a leaked-token signal). Optionally persisted to a JSON file
    (PH_REFRESH_STORE_PATH) so refresh survives restarts.
    """

    def __init__(self, path: Optional[str] = None, ttl: int = REFRESH_TOKEN_TTL):
        self._path = path
        self._ttl = ttl
        self._lock = threading.Lock()
        self._records = {}  # hash -> dict(family, login, claims, expires, used)
        if path and os.path.exists(path):
            try:
                with open(path) as f:
                    self._records = json.load(f)
            except (OSError, ValueError):
                self._records = {}

    def _save(self):
        if not self._path:
            return
        tmp = self._path + ".tmp"
        with open(tmp, "w") as f:
            json.dump(self._records, f)
        os.chmod(tmp, 0o600)
        os.replace(tmp, self._path)

    def _new(self, family: str, login: str, claims: dict) -> str:
        token = secrets.token_urlsafe(48)
        self._records[_hash(token)] = {
            "family": family,
            "login": login,
            "claims": claims,
            "expires": time.time() + self._ttl,
            "used": False,
        }
        return token

    def issue(self, claims: dict) -> str:
        """Start a new family for a freshly authenticated user."""
        with self._lock:
            self._purge()
            token = self._new(secrets.token_hex(8), claims["login"], claims)
            self._save()
            return token

    def rotate(self, token: str) -> Optional[tuple]:
        """
        Exchange a refresh token. Returns (claims, new_refresh_token), or None
        if the token is unknown, expired, revoked or already used.
        """
        with self._lock:
            rec = self._records.get(_hash(token))
            if rec is None:
                return None
            if rec["used"]:
                self._drop_family(rec["family"])
                self._save()
                return None
            if rec["expires"] < time.time():
                return None
            rec["used"] = True
            new = self._new(rec["family"], rec["login"], rec["claims"])
            self._save()
            return rec["claims"], new

    def revoke(self, token: str) -> bool:
        with self._lock:
            rec = self._records.get(_hash(token))
            if rec is None:
                return False
            self._drop_family(rec["family"])
            self._save()
            return True

    def revoke_login(self, login: str) -> int:
        with self._lock:
            hashes = [h for h, r in self._records.items() if r["login"] == login]
            for h in hashes:
                del self._records[h]
            self._save()
            return len(hashes)

    def _drop_family(self, family: str):
        for h in [h for h, r in self._records.items() if r["family"] == family]:
            del self._records[h]

    def _purge(self):
        now = time.time()
        for h in [h for h, r in self._records.items() if r["expires"] < now]:
            del self._records[h]


refresh_store = RefreshTokenStore(path=os.getenv("PH_REFRESH_STORE_PATH"))
