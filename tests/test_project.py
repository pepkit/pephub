import sys, os
import jwt
import pytest

myPath = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, myPath + "/../")
from unittest.mock import Mock
from fastapi.testclient import TestClient
from pephub.main import app
from pephub.dependencies import CLIAuthSystem
client = TestClient(app)
from fastapi.exceptions import HTTPException
# fetch a project
def test_fetch_project():
    res = client.get("/pep/demo/BiocProject")
    assert res.status_code == 200


# attempt to fetch a project that does not
# exist
def test_project_dne():
    DNE_NAME = "frosty-hedgehog"
    res = client.get(f"/pep/demo/{DNE_NAME}")
    assert res.status_code == 404


# fetch a projects configuration file
def test_fetch_config():
    res = client.get("/pep/demo/BiocProject/config")
    assert res.status_code == 200


# fetch a projects list of samples
def test_fetch_samples():
    res = client.get("/pep/demo/BiocProject/samples")
    assert res.status_code == 200

    # verify two sample files in project
    assert len(res.json()) == 2


# fetch a specific sample/file in a project
def test_fetch_sample():
    res = client.get("/pep/demo/BiocProject/samples/laminB1Lads")
    assert res.status_code == 200


def test_jwt_is_generated_correctly(mocker, test_access_token, test_user_data):
    mocker.patch("requests.get", return_value=Mock(content=test_user_data))

    jwt_token = CLIAuthSystem().get_jwt(test_access_token)

    assert jwt.decode(jwt_token, options={"verify_signature": False}) == {'login': 'test_login', 'id': 12345, 'organizations': ['org1', 'org2']}


@pytest.mark.parametrize(
    "respose_content",
    [
        b"",
        {"data": "some_data"},
    ]
)
def test_get_jwt_raises_correct_error(mocker, test_access_token, test_user_data, respose_content):
    mocker.patch("requests.get", return_value=Mock(content=respose_content))

    with pytest.raises(HTTPException) as e:
        CLIAuthSystem().get_jwt(test_access_token)

    assert e.value.status_code == 400
