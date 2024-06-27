import os
import tempfile

import pytest
import requests
from pepdbagent import PEPDatabaseAgent
from peppy import Project


@pytest.fixture
def test_access_token():
    return "access_token"


@pytest.fixture
def test_user_data():
    return b'{"login": "test_login", "id": 12345, "organizations": ["org1", "org2"]}'


@pytest.fixture
def requests_get_mock(mocker):
    return mocker.patch("requests.get")


@pytest.fixture
def data_path():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")


@pytest.fixture
def schemas_path(data_path):
    return os.path.join(data_path, "schemas")


@pytest.fixture
def peps_path(data_path):
    return os.path.join(data_path, "peps")


@pytest.fixture
def project_file_path(peps_path):
    return os.path.join(peps_path, "test_pep", "test_cfg.yaml")


@pytest.fixture
def project_object_file(project_file_path):
    return Project(project_file_path)


@pytest.fixture
def schema_file_path(schemas_path):
    return os.path.join(schemas_path, "test_schema.yaml")


@pytest.fixture
def schema_file_path_invalid(schemas_path):
    return os.path.join(schemas_path, "test_schema_bad.yaml")


@pytest.fixture
def project_object_registry(project_file_path):
    return Project(project_file_path)


@pytest.fixture
def yaml_string():
    return """
    description: test PEP schema
    properties:
      dcc:
        type: object
        properties:
          compute_packages:
            type: object
      samples:
        type: array
        items:
          type: object
          properties:
            sample_name:
              type: string
            protocol:
              type: string
            genome:
              type: string
    required:
      - samples
    """


@pytest.fixture
def schema_paste(yaml_string):
    with tempfile.NamedTemporaryFile(mode="w", delete=False) as yaml_file:
        yaml_file.write(yaml_string)
        file_path = yaml_file.name
    return file_path


@pytest.fixture
def yaml_string_invalid():
    return """
    description: test PEP schema
    properties:
      dcc:
        type: object
        properties:
          compute_packages:
            type: object
      samples:
        type: array
        items:
          type: object
          properties:
            sample_name:
              type: string
            protocol:
              type: string
            genome:
              type: string
    required:
      - samples
      - fail
    """


@pytest.fixture
def schema_paste_invalid(yaml_string_invalid):
    with tempfile.NamedTemporaryFile(mode="w", delete=False) as yaml_file:
        yaml_file.write(yaml_string_invalid)
        file_path = yaml_file.name
    return file_path


@pytest.fixture(scope="session")
def db():
    agent = PEPDatabaseAgent(
        user=os.environ.get("POSTGRES_USER"),
        password=os.environ.get("POSTGRES_PASSWORD"),
        host=os.environ.get("POSTGRES_HOST"),
        database=os.environ.get("POSTGRES_DB"),
        port=os.environ.get("POSTGRES_PORT"),
    )
    return agent


@pytest.fixture
def schema_from_url_valid():
    url = "https://schema.databio.org/pep/2.1.0.yaml"
    response = requests.get(url)
    yaml_string = response.text

    with tempfile.NamedTemporaryFile(mode="w", delete=False) as yaml_file:
        yaml_file.write(yaml_string)
        file_path = yaml_file.name

    return file_path


@pytest.fixture
def schema_from_url_invalid():
    url = "https://schema.databio.org/pipelines/ProseqPEP.yaml"
    response = requests.get(url)
    yaml_string = response.text

    with tempfile.NamedTemporaryFile(mode="w", delete=False) as yaml_file:
        yaml_file.write(yaml_string)
        file_path = yaml_file.name

    return file_path
