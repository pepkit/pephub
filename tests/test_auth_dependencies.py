"""
Sign-in tokens are not guaranteed to carry an "orgs" list. These tests make
sure a token without one still works, instead of causing 500 errors.
"""

import json
from unittest.mock import Mock

import jwt
import pytest
from fastapi import BackgroundTasks
from fastapi.testclient import TestClient

from pephub.const import JWT_SECRET
from pephub.dependencies import get_organizations_from_session_info
from pephub.helpers import jwt_encode_user_data
from pephub.main import app
from pephub.routers.auth import base as auth_base


@pytest.mark.parametrize(
    "session_info, expected",
    [
        (None, []),
        ({"login": "a"}, []),
        ({"orgs": None}, []),
        ({"orgs": "x"}, []),
        ({"orgs": ["OrgA"]}, ["orga"]),
    ],
)
def test_orgs_from_token(session_info, expected):
    assert get_organizations_from_session_info(session_info) == expected


def test_token_without_orgs_can_use_routes():
    client = TestClient(app)
    token = jwt_encode_user_data({"login": "alice", "id": 1})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/namespaces/alice/projects", headers=headers)
    assert res.status_code == 200
    res = client.get("/api/v1/namespaces/alice/stars", headers=headers)
    assert res.status_code == 200
    res = client.get("/api/v1/namespaces/bob/stars", headers=headers)
    assert res.status_code == 403


def test_login_survives_github_orgs_error(mocker):
    """If GitHub sends an error instead of an orgs list, login still works."""
    user = {"login": "Alice", "id": 1, "organizations_url": "https://gh/orgs"}

    def fake_get(url, **kwargs):
        if url == user["organizations_url"]:
            return Mock(json=lambda: {"message": "rate limited"})
        return Mock(json=lambda: dict(user))

    mocker.patch.object(
        auth_base.requests,
        "post",
        return_value=Mock(json=lambda: {"access_token": "gh-token"}),
    )
    mocker.patch.object(auth_base.requests, "get", side_effect=fake_get)
    auth_base.DEVICE_CODES["device-1"] = {"token": None}

    auth_base.callback(
        BackgroundTasks(),
        code="code",
        state=json.dumps({"device": True, "device_code": "device-1"}),
    )

    token = auth_base.DEVICE_CODES.pop("device-1")["token"]
    payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    assert payload["orgs"] == []
    assert payload["login"] == "alice"
