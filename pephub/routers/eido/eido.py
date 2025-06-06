import shutil
import tempfile
from typing import List, Optional, Tuple

import eido
import peppy
import requests
import yaml
from fastapi import APIRouter, Depends, Form, UploadFile
from fastapi.exceptions import HTTPException
from pepdbagent import PEPDatabaseAgent
from pepdbagent.utils import registry_path_converter
from pepdbagent.exceptions import SchemaDoesNotExistError
from pepdbagent.utils import schema_path_converter
from pepdbagent.const import LATEST_SCHEMA_VERSION
from starlette.requests import Request
from starlette.responses import JSONResponse

from ...dependencies import DEFAULT_TAG, get_db
from ...helpers import parse_user_file_upload, split_upload_files_on_init_file
from ...const import MAX_PROCESSED_PROJECT_SIZE

schemas_url = "https://schema.databio.org/list.json"
schemas_to_test = requests.get(schemas_url).json()

router = APIRouter(prefix="/api/v1/eido", tags=["eido"])


@router.get("/schemas")
async def status():
    return JSONResponse(schemas_to_test)


@router.get("/schemas/{namespace}/{project}")
async def get_schema(request: Request, namespace: str, project: str):
    """
    Takes namespace and project values for a schema endpoint
    and returns a custom validator HTML page.
    """
    # endpoint to schema.databio.org/...
    # like pipelines/ProseqPEP.yaml

    try:
        schema = eido.read_schema(
            f"https://schema.databio.org/{namespace}/{project}.yaml"
        )[0]
    except IndexError:
        raise HTTPException(status_code=404, detail="Schema not found")

    return schema


@router.post("/validate")
async def validate(
    # accept both pep_registry and pep_files, both should be optional
    pep_registry: Optional[str] = Form(None),
    pep_files: Optional[List[UploadFile]] = None,
    schema: Optional[str] = Form(None),
    schema_file: Optional[UploadFile] = None,
    schema_registry: Optional[str] = Form(None),
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    This endpoint validates a PEP against a schema. That is, one PEP, and one schema.

    The PEP is one of two options: A list of UploadFiles that constitute the PEP, or a string
    which is then assumed to be the registry path to the PEP inside PEPhub. The schema, on the other hand,
    is always a string to a JSON-stringified version of the schema (which is a JSON Schema yaml file).

    The validation happens in three steps: First, the PEP is saved to disk and loaded into memory. Second, the
    the schema is saved to disk and loaded into memory. Finally, the PEP is validated against the schema using
    eido. The validation results are then returned as a JSON object.

    If at any point the PEP or schema cannot be validated, an error is raised and the validation process is
    halted. We also should return errors for when the PEP or Schema can't be loaded or found for some reason.
    """

    # check they sent at least pep_registry or pep_files
    if pep_registry is None and pep_files is None:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Must supply either a registry path or a list of files to validate."
            },
        )

    if pep_registry is not None:
        namespace, name, tag = registry_path_converter(pep_registry)
        tag = tag or DEFAULT_TAG

        pep_annot = agent.annotation.get(namespace=namespace, name=name, tag=tag)

        if pep_annot.results[0].number_of_samples > MAX_PROCESSED_PROJECT_SIZE:
            return {
                "valid": False,
                "error_type": "Project size",
                "errors": ["Project is too large. Can't validate."],
            }

        p = agent.project.get(namespace, name, tag, raw=False)
    else:
        init_file = parse_user_file_upload(pep_files)
        init_file, other_files = split_upload_files_on_init_file(pep_files, init_file)

        # create temp dir that gets deleted when we're done
        with tempfile.TemporaryDirectory() as dirpath:
            # save init file
            with open(f"{dirpath}/{init_file.filename}", "wb") as cfg_fh:
                shutil.copyfileobj(init_file.file, cfg_fh)

            # save any other files the user might have supplied
            if other_files is not None:
                for upload_file in other_files:
                    # open new file inside the tmpdir
                    with open(f"{dirpath}/{upload_file.filename}", "wb") as local_tmpf:
                        shutil.copyfileobj(upload_file.file, local_tmpf)

            p = peppy.Project(f"{dirpath}/{init_file.filename}")

    if schema is None and schema_registry is None and schema_file is None:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Must supply either a registry path or a list of files to validate."
            },
        )

    if schema_registry is not None:
        schema_namespace, schema_name, schema_version = schema_path_converter(
            schema_registry
        )

        try:
            schema = agent.schema.get(
                namespace=schema_namespace,
                name=schema_name,
                version=(
                    schema_version
                    if schema_version is not None
                    else LATEST_SCHEMA_VERSION
                ),
            )
            yaml_string = yaml.dump(schema)

        except SchemaDoesNotExistError:
            raise HTTPException(
                status_code=404,
                detail={"error": "Schema not found."},
            )

        # save schema string to temp file
        with tempfile.NamedTemporaryFile(mode="w", delete=False) as yaml_file:
            yaml_file.write(yaml_string)
            schema_dict = yaml_file.name
    elif schema_file is not None:
        contents = schema_file.file.read()
        schema_dict = yaml.safe_load(contents)
    else:
        # save schema string to temp file, then read in with eido
        with tempfile.NamedTemporaryFile(mode="w") as schema_file:
            schema_file.write(schema)
            schema_file.flush()
            try:
                schema_dict = eido.read_schema(schema_file.name)[0]
            except eido.exceptions.EidoSchemaInvalidError as e:
                raise HTTPException(
                    status_code=200,
                    detail={"error": f"Schema is invalid: {str(e)}"},
                )

    # validate project
    try:
        eido.validate_project(
            p,
            schema_dict,
        )

    # while we catch this, its still a 200 response since we want to
    # return the validation errors
    except eido.exceptions.EidoValidationError as e:
        error_type, property_names = await eido_error_string_converter(e)

        return {"valid": False, "error_type": error_type, "errors": property_names}

    except Exception as e:
        errors = [str(e)]
        return {"valid": False, "error_type": "Schema", "errors": errors}

    # everything passed, return valid
    else:
        # return project is valid
        return {"valid": True, "errors": None}


async def eido_error_string_converter(
    e: eido.exceptions.EidoValidationError,
) -> Tuple[str, List[str]]:
    """
    Convert eido error into nice modified string

    :param e: eido Validation error
    :return: error_type, property_names
    """
    property_names = []
    error_type_list = []
    for item_list in e.errors_by_type.values():
        property_type = item_list[0]["type"]
        property_name_list = []
        for item in item_list:
            if item["sample_name"] == "project":
                error_type_list.append("Project")
                break
            else:
                error_type_list.append("Samples")
                if len(item_list) > 20:
                    property_names = ["More than 20 samples have encountered errors."]
                else:
                    property_name_list.append(item["sample_name"])

        if len(property_name_list) > 0:
            property_names.append(f"{property_type} ({', '.join(property_name_list)})")
        else:
            property_names.append(f"{property_type} in the project")
    error_type = " and ".join(set(error_type_list))
    return error_type, property_names
