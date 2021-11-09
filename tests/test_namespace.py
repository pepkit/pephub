import sys, os
myPath = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, myPath + '/../')

from fastapi.testclient import TestClient
from pephub.main import app
from tests.const import NAMESPACE_DNE_PKG

client = TestClient(app)

# fetch namespace summary
def test_base():
    res = client.get("v1/demo")
    assert res.status_code == 200

    # verify amount of projects inside demo
    assert len(res.json()) == 26

# attempt to fetch a namespace that does not exist
def test_namespace_dne():
    DNE_NAME = "alpine-porcupine"
    res = client.get(f"/v1/{DNE_NAME}")
    assert res.status_code == 404
    assert res.json() == NAMESPACE_DNE_PKG