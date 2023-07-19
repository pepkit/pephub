import eido
import pytest
from pephub.dependencies import *

pytest_plugins = ("pytest_asyncio",)


# test project file on schema file validation success
def test_file_file_validate_valid(project_object_file, schema_file_path):
    eido.validate_project(project=project_object_file, schema=schema_file_path)


# test project file on schema file validation failure
def test_file_file_validate_invalid(project_object_file, schema_file_path_invalid):
    with pytest.raises(eido.exceptions.EidoValidationError):
        eido.validate_project(
            project=project_object_file, schema=schema_file_path_invalid
        )


# test project file on schema string validation success
def test_file_string_validate_valid(project_object_file, schema_paste):
    eido.validate_project(project=project_object_file, schema=schema_paste)


# test project file on schema string validation failure
def test_file_string_validate_invalid(project_object_file, schema_paste_invalid):
    with pytest.raises(eido.exceptions.EidoValidationError):
        eido.validate_project(project=project_object_file, schema=schema_paste_invalid)


# test project file on schema url validation success
def test_file_url_validate_valid(project_object_file, schema_from_url_valid):
    eido.validate_project(project=project_object_file, schema=schema_from_url_valid)


# test project file on schema url validation failure
def test_file_url_validate_invalid(project_object_file, schema_from_url_invalid):
    with pytest.raises(eido.exceptions.EidoValidationError):
        eido.validate_project(
            project=project_object_file, schema=schema_from_url_invalid
        )


def test_registry_paste_valid(db, schema_paste):
    p = db.project.get("ayobi", "new-project-test12345", "default")
    eido.validate_project(project=p, schema=schema_paste)


def test_registry_paste_invalid(db, schema_paste_invalid):
    p = db.project.get("ayobi", "new-project-test12345", "default")
    with pytest.raises(eido.exceptions.EidoValidationError):
        eido.validate_project(project=p, schema=schema_paste_invalid)


def test_registry_file_valid(db, schema_file_path):
    p = db.project.get("ayobi", "new-project-test12345", "default")
    eido.validate_project(project=p, schema=schema_file_path)


def test_registry_file_invalid(db, schema_file_path_invalid):
    p = db.project.get("ayobi", "new-project-test12345", "default")
    with pytest.raises(eido.exceptions.EidoValidationError):
        eido.validate_project(project=p, schema=schema_file_path_invalid)


def test_registry_url_valid(db, schema_from_url_valid):
    p = db.project.get("ayobi", "new-project-test12345", "default")
    eido.validate_project(project=p, schema=schema_from_url_valid)


def test_registry_url_invalid(db, schema_from_url_invalid):
    p = db.project.get("ayobi", "new-project-test12345", "default")
    with pytest.raises(eido.exceptions.EidoValidationError):
        eido.validate_project(project=p, schema=schema_from_url_invalid)
