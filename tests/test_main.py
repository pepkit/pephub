import sys, os
myPath = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, myPath + '/../')

from fastapi.testclient import TestClient
from pephub.main import app

client = TestClient(app)

def test_base():
    res = client.get("/v1")
    assert res.status_code == 200
    assert res.json() =={"message": "welcome to the pepserver"}
