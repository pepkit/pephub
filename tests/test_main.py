import sys, os
myPath = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, myPath + '/../')

from fastapi.testclient import TestClient
from pephub.main import app
from const import WELCOME_PKG

client = TestClient(app)

# fetch base route
def test_base():
    res = client.get("/v1")
    assert res.status_code == 200
    assert res.json() == WELCOME_PKG
