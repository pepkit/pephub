import eido
import jinja2
import aiofiles
import requests
import tempfile
import peppy
import yaml
import shutil
import pandas as pd

from io import StringIO
from fastapi import File, UploadFile, Form, APIRouter
from fastapi.responses import HTMLResponse
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.responses import FileResponse
from starlette.templating import Jinja2Templates
from typing import List
from yacman import load_yaml

from ..models import RawValidationQuery
from ...const import EIDO_TEMPLATES_PATH, STATICS_PATH
from ...helpers import parse_user_file_upload, split_upload_files_on_init_file
from ...dependencies import *

templates = Jinja2Templates(directory=EIDO_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(EIDO_TEMPLATES_PATH))

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


# NEW STUFF FOR REACT FRONTEND
@router.post("/validate")
async def validate(
    # accept both pep_registry and pep_files, both should be optional
    pep_registry: Optional[str] = Form(None),
    pep_files: Optional[List[UploadFile]] = None,
    schema: Optional[str] = Form(None),
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
        # split into namespace, name, tag
        namespace, name_tag = pep_registry.split("/")
        name, tag = name_tag.split(":")
        p = agent.project.get(namespace, name, tag)
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

    if schema is None and schema_registry is None:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Must supply either a registry path or a list of files to validate."
            },
        )
    
    if schema_registry is not None:
        schema_url = f"https://schema.databio.org/{schema_registry}.yaml"
            
        try:
            response = requests.get(schema_url)
            response.raise_for_status()  # Check if the request was successful
            yaml_string = response.text
        except requests.exceptions.RequestException as e:
            raise HTTPException(
                status_code=400,
                detail={"error": f"Error fetching schema: {str(e)}"},
            )

        # save schema string to temp file
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as yaml_file:
            yaml_file.write(yaml_string)
            schema_dict = yaml_file.name
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
        sample_names = []
        for item_list in e.errors_by_type.values():
            for item in item_list:
                if item['sample_name'] == "project":
                    error_type = "Project"
                    sample_names = None
                    break
                else:
                    sample_names.append(item['sample_name'])
                    error_type = "Samples"

        if sample_names is not None:
            sample_counter = len(sample_names)
            if sample_counter > 30:
                sample_names = ["More than 30 samples have encountered errors."]
            else:
                sample_names = ", ".join(sample_names)

        errors = [str(error) for error in e.errors_by_type]
        return {"valid": False, "error_type": error_type, "sample_names": sample_names, "errors": errors}

    except Exception as e:
        raise HTTPException(
            status_code=406,
            detail={"error": f"Unknown error while validating: {str(e)}"},
        )
    # everything passed, return valid
    else:
        # return project is valid
        return {"valid": True, "errors": None}
