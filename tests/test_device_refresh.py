from unittest import mock

import jwt
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# pephub.dependencies opens a database connection at import; this test needs none.
import os

import pepdbagent

os.environ.setdefault("BASE_URI", "http://localhost")

pepdbagent.PEPDatabaseAgent = mock.MagicMock()

from pephub.const import JWT_SECRET
from pephub.refresh_tokens import RefreshTokenStore
from pephub.routers.auth import base
from pephub.routers.auth.base import auth, DEVICE_CODES
from pephub.limiter import limiter

CLAIMS = {"login": "alice", "orgs": ["lab"], "id": 1}


@pytest.fixture
def client(monkeypatch):
    store = RefreshTokenStore()
    monkeypatch.setattr(base, "refresh_store", store)
    limiter.enabled = False
    app = FastAPI()
    app.state.limiter = limiter
    app.include_router(auth)
    c = TestClient(app)
    c.store = store
    return c


def _device_login(client):
    DEVICE_CODES["dc"] = {
        "token": "jwt-from-github-login",
        "claims": CLAIMS,
        "client_host": "testclient",
    }
    return client.post("/auth/device/token", headers={"device-code": "dc"})


def test_issue(client):
    r = _device_login(client)
    assert r.status_code == 200
    body = r.json()
    assert body["jwt_token"] == "jwt-from-github-login"
    assert body["refresh_token"]


def test_refresh_returns_valid_jwt_and_new_refresh(client):
    old = _device_login(client).json()["refresh_token"]
    r = client.post("/auth/token/refresh", json={"refresh_token": old})
    assert r.status_code == 200
    body = r.json()
    assert body["refresh_token"] != old
    decoded = jwt.decode(body["jwt_token"], JWT_SECRET, algorithms=["HS256"])
    assert decoded["login"] == "alice"
    # new JWT works on an authenticated endpoint
    s = client.get("/auth/session", headers={"Authorization": body["jwt_token"]})
    assert s.status_code == 200


def test_rotation_chain(client):
    t = _device_login(client).json()["refresh_token"]
    for _ in range(3):
        r = client.post("/auth/token/refresh", json={"refresh_token": t})
        assert r.status_code == 200
        t = r.json()["refresh_token"]


def test_reuse_refused_and_revokes_family(client):
    old = _device_login(client).json()["refresh_token"]
    new = client.post("/auth/token/refresh", json={"refresh_token": old}).json()[
        "refresh_token"
    ]
    assert (
        client.post("/auth/token/refresh", json={"refresh_token": old}).status_code
        == 401
    )
    # the reuse also killed the newer token
    assert (
        client.post("/auth/token/refresh", json={"refresh_token": new}).status_code
        == 401
    )


def test_unknown_token(client):
    r = client.post("/auth/token/refresh", json={"refresh_token": "nope"})
    assert r.status_code == 401


def test_revoke_token(client):
    t = _device_login(client).json()["refresh_token"]
    assert (
        client.post("/auth/token/revoke", json={"refresh_token": t}).status_code == 202
    )
    assert (
        client.post("/auth/token/refresh", json={"refresh_token": t}).status_code
        == 401
    )


def test_revoke_all_for_login(client):
    t = _device_login(client).json()["refresh_token"]
    jwt_token = client.post("/auth/token/refresh", json={"refresh_token": t}).json()
    r = client.delete(
        "/auth/token/refresh", headers={"Authorization": jwt_token["jwt_token"]}
    )
    assert r.status_code == 202 and r.json()["revoked"] >= 1
    assert (
        client.post(
            "/auth/token/refresh", json={"refresh_token": jwt_token["refresh_token"]}
        ).status_code
        == 401
    )


def test_expiry(client):
    store = RefreshTokenStore(ttl=-1)
    base.refresh_store = store
    t = store.issue(CLAIMS)
    assert client.post("/auth/token/refresh", json={"refresh_token": t}).status_code == 401


def test_persistence(tmp_path):
    p = str(tmp_path / "r.json")
    t = RefreshTokenStore(path=p).issue(CLAIMS)
    claims, new = RefreshTokenStore(path=p).rotate(t)
    assert claims["login"] == "alice"
    assert "alice" in open(p).read() and t not in open(p).read()  # only hashes stored
