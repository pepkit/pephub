import sys, os

myPath = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, myPath + '/../')

from fastapi.testclient import TestClient
from pephub.main import app

client = TestClient(app)

# fetch a project
def test_fetch_project():
    res = client.get("/v1/demo/BiocProject")
    assert res.status_code == 200

# attempt to fetch a project that does not
# exist
def test_project_dne():
    DNE_NAME = "frosty-hedgehog"
    res = client.get(f"/v1/demo/{DNE_NAME}")
    assert res.status_code == 404

# fetch a projects configuration file
def test_fetch_config():
    res = client.get("/v1/demo/BiocProject/config")
    assert res.status_code == 200

# fetch a projects list of samples
def test_fetch_samples():
    res = client.get("/v1/demo/BiocProject/samples")
    assert res.status_code == 200

    # verify two sample files in project
    assert len(res.json()) == 2

# fetch a specific sample/file in a project
def test_fetch_sample():
    res = client.get("/v1/demo/BiocProject/samples/laminB1Lads")
    assert res.status_code == 200
