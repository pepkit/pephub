from datetime import datetime, timedelta
from typing import Dict, List

import secrets

from fastapi import HTTPException
from pydantic import BaseModel

from .const import MAX_NEW_KEYS
from .dependencies import CLIAuthSystem


class DeveloperKey(BaseModel):
    key: str
    created_at: str
    expires: str


class DeveloperKeyHandler:
    def __init__(self, default_exp: int = 30 * 24 * 60 * 60):
        self._keys: Dict[str, List[DeveloperKey]] = {}
        self._default_exp = default_exp

    def add_key(self, namespace: str, key: DeveloperKey):
        """
        Add a key to the handler for a given namespace/user

        :param namespace: namespace for the key
        :param key: DeveloperKey object
        """
        if namespace not in self._keys:
            self._keys[namespace] = []
        if len(self._keys[namespace]) >= MAX_NEW_KEYS:
            raise HTTPException(
                status_code=400,
                detail="You have reached the maximum number of keys allowed",
            )
        self._keys[namespace].append(key)

    def get_keys_for_namespace(self, namespace: str) -> List[DeveloperKey]:
        """
        Get all the keys for a given namespace

        namespace: str
        """
        return self._keys.get(namespace) or []

    def remove_key(self, namespace: str, last_five_chars: str):
        """
        Remove a key from the handler for a given namespace/user

        :param namespace: namespace for the key
        :param key: key to remove
        """
        if namespace in self._keys:
            self._keys[namespace] = [
                key for key in self._keys[namespace] if key.key[-5:] != last_five_chars
            ]

    def mint_key_for_namespace(
        self, namespace: str, session_info: dict
    ) -> DeveloperKey:
        """
        Mint a new key for a given namespace

        :param namespace: namespace for the key
        """
        salt = secrets.token_hex(32)
        session_info["salt"] = salt
        expiry = datetime.utcnow() + timedelta(seconds=self._default_exp)
        new_key = CLIAuthSystem.jwt_encode_user_data(session_info, exp=expiry)
        key = DeveloperKey(
            key=new_key,
            created_at=datetime.utcnow().isoformat(),
            expires=expiry.isoformat(),
        )
        self.add_key(namespace, key)
        return key
