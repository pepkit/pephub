"""
Sign-in tokens are not guaranteed to carry an "orgs" list. These tests make
sure a token without one still works, instead of causing 500 errors.
"""

import pytest
from fastapi.testclient import TestClient

from pephub.dependencies import get_organizations_from_session_info
from pephub.helpers import jwt_encode_user_data
from pephub.main import app


@pytest.mark.parametrize(
    "session_info, expected",
    [
        (None, []),
        ({"login": "a"}, []),
        ({"orgs": None}, []),
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
