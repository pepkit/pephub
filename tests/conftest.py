import pytest


@pytest.fixture
def test_access_token():
    return "access_token"


@pytest.fixture
def test_user_data():
    return b'{"login": "test_login", "id": 12345, "organizations": ["org1", "org2"]}'


@pytest.fixture
def requests_get_mock(mocker):
    return mocker.patch("requests.get")
