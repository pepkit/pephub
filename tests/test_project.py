"""
Upload a small PEP, read it back through the API, then delete it.
Needs a running database, but no data loaded in advance.
"""

import os
from pathlib import Path

from fastapi.testclient import TestClient

from pephub.helpers import jwt_encode_user_data
from pephub.main import app

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
NAMESPACE = "pephub-test"
NAME = "frogs"
SCHEMA = "pep"
SCHEMA_URL = f"/api/v1/schemas/{NAMESPACE}"
OWNER = {
    "Authorization": f"Bearer {jwt_encode_user_data({'login': NAMESPACE, 'id': 1, 'orgs': []})}"
}
OTHER = {
    "Authorization": f"Bearer {jwt_encode_user_data({'login': 'someone-else', 'id': 2, 'orgs': []})}"
}


def upload(client, url, is_private=False):
    """Upload the frogs PEP to url, with the schema every project must point at."""
    # clear anything left over from an earlier failed run
    cleanup(client, url)
    res = client.post(
        f"{SCHEMA_URL}/files",
        data={"schema_name": SCHEMA, "version": "1.0.0"},
        files={"schema_file": ("pep.yaml", b"type: object\n")},
        headers=OWNER,
    )
    assert res.status_code == 202, res.text

    files = [
        ("files", (f, Path(DATA, f).read_bytes()))
        for f in ["project_config.yaml", "sample_table.csv"]
    ]
    res = client.post(
        f"/api/v1/namespaces/{NAMESPACE}/projects/files",
        data={
            "name": url.rsplit("/", 1)[1],
            "pep_schema": f"{NAMESPACE}/{SCHEMA}:1.0.0",
            "is_private": str(is_private).lower(),
        },
        files=files,
        headers=OWNER,
    )
    assert res.status_code == 202, res.text


def cleanup(client, url):
    client.delete(url, headers=OWNER)
    client.delete(f"{SCHEMA_URL}/{SCHEMA}", headers=OWNER)


def test_upload_read_delete_project():
    client = TestClient(app)
    url = f"/api/v1/projects/{NAMESPACE}/{NAME}"
    upload(client, url)
    try:
        assert client.get(url).status_code == 200
        assert client.get(f"{url}/config").status_code == 200
        samples = client.get(f"{url}/samples").json()
        assert [s["sample_name"] for s in samples["items"]] == ["frog_1", "frog_2"]
        assert client.get(f"{url}/samples/frog_1").status_code == 200
        assert client.get(f"{url}/samples/no-such-frog").status_code == 404
        assert client.get(f"{url}-missing").status_code == 404

        # only the owner may delete
        assert client.delete(url).status_code == 401
        assert client.delete(url, headers=OTHER).status_code == 403
        assert client.get(url).status_code == 200

        assert client.delete(url, headers=OWNER).status_code == 202
        assert client.get(url).status_code == 404
    finally:
        cleanup(client, url)


def test_namespace_counts_hide_private_projects():
    client = TestClient(app)
    url = f"/api/v1/projects/{NAMESPACE}/{NAME}-private"
    upload(client, url, is_private=True)
    try:

        def counts(headers=None):
            info = client.get(f"/api/v1/namespaces/{NAMESPACE}/", headers=headers)
            return info.json()["number_of_projects"], info.json()["number_of_samples"]

        assert counts(OWNER) == (1, 2)
        assert counts() == (0, 0)
        assert counts(OTHER) == (0, 0)
    finally:
        cleanup(client, url)
