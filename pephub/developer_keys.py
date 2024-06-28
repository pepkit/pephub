from datetime import datetime, timedelta
from typing import Dict, List

import jwt
from pydantic import BaseModel

from .const import JWT_SECRET
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
        self._keys[namespace].append(key)

    def get_keys_for_namespace(self, namespace: str) -> List[DeveloperKey]:
        """
        Get all the keys for a given namespace

        namespace: str
        """
        return self._keys.get(namespace)

    def remove_key(self, namespace: str, key: str):
        """
        Remove a key from the handler for a given namespace/user

        :param namespace: namespace for the key
        :param key: key to remove
        """
        if namespace in self._keys:
            self._keys[namespace] = [k for k in self._keys[namespace] if k.key != key]

    def mint_key_for_namespace(
        self, namespace: str, session_info: dict
    ) -> DeveloperKey:
        """
        Mint a new key for a given namespace

        :param namespace: namespace for the key
        """
        expiry = datetime.utcnow() + timedelta(seconds=self._default_exp)
        new_key = CLIAuthSystem.jwt_encode_user_data(session_info, exp=expiry)
        key = DeveloperKey(
            key=new_key,
            created_at=datetime.utcnow().isoformat(),
            expires=expiry.isoformat(),
        )
        self.add_key(namespace, key)
        return key
