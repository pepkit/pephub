"""
Upload a small PEP, read it back through the API, then delete it.
Needs a running database, but no data loaded in advance.
"""

import os

from fastapi.testclient import TestClient

from pephub.helpers import jwt_encode_user_data
from pephub.main import app

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
NAMESPACE = "pephub-test"
NAME = "frogs"
SCHEMA = "pep"


def test_upload_read_delete_project():
    client = TestClient(app)
    token = jwt_encode_user_data({"login": NAMESPACE, "id": 1, "orgs": []})
    headers = {"Authorization": f"Bearer {token}"}
    url = f"/api/v1/projects/{NAMESPACE}/{NAME}"
    schema_url = f"/api/v1/schemas/{NAMESPACE}"

    # clear anything left over from an earlier failed run
    client.delete(url, headers=headers)
    client.delete(f"{schema_url}/{SCHEMA}", headers=headers)

    # every project must point at a schema that exists
    res = client.post(
        f"{schema_url}/files",
        data={"schema_name": SCHEMA, "version": "1.0.0"},
        files={"schema_file": ("pep.yaml", b"type: object\n")},
        headers=headers,
    )
    assert res.status_code == 202, res.text

    files = [
        ("files", (f, open(os.path.join(DATA, f), "rb")))
        for f in ["project_config.yaml", "sample_table.csv"]
    ]
    res = client.post(
        f"/api/v1/namespaces/{NAMESPACE}/projects/files",
        data={"name": NAME, "pep_schema": f"{NAMESPACE}/{SCHEMA}:1.0.0"},
        files=files,
        headers=headers,
    )
    assert res.status_code == 202, res.text

    try:
        assert client.get(url).status_code == 200
        assert client.get(f"{url}/config").status_code == 200
        samples = client.get(f"{url}/samples").json()
        assert [s["sample_name"] for s in samples["items"]] == ["frog_1", "frog_2"]
        assert client.get(f"{url}/samples/frog_1").status_code == 200
        assert client.get(f"{url}/samples/no-such-frog").status_code == 404
        assert client.get(f"{url}-missing").status_code == 404
    finally:
        assert client.delete(url, headers=headers).status_code == 202
        client.delete(f"{schema_url}/{SCHEMA}", headers=headers)
    assert client.get(url).status_code == 404
