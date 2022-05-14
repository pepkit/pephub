import sys, os
myPath = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, myPath + '/../')

from fastapi.testclient import TestClient
from pephub.main import app

client = TestClient(app)

# fetch namespace summary
def test_base():
    res = client.get("/pep/demo")
    assert res.status_code == 200

    # verify amount of projects inside demo
    assert len(res.json()) == 26

# attempt to fetch a namespace that does not exist
def test_namespace_dne():
    DNE_NAME = "alpine-porcupine"
    res = client.get(f"/{DNE_NAME}")
    assert res.status_code == 404