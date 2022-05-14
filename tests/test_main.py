import sys, os
myPath = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, myPath + '/../')

from fastapi.testclient import TestClient
from pephub.main import app

client = TestClient(app)

# fetch base route
def test_base():
    res = client.get("/")
    assert res.status_code == 200
