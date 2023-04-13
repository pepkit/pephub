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

path_to_schemas = f"{os.path.dirname(__file__)}/../schemas.yaml"
try:
    schemas_to_test = load_yaml(path_to_schemas)
except Exception as e:
    print(e, flush=True)


def vwrap(p, schema):
    """
    Validation wrapper function

    This little helper function just wraps the eido validate_project function
    to catch the exceptions raised and convert them into error reports.
    @param p peppy.Project object to validate
    @param schema Eido schema to validate against
    """
    x = None
    try:
        eido.validate_project(project=p, schema=schema, exclude_case=True)
    except Exception as e:
        x = str(e)
        print(x)
    return x


def temp_pep(file):
    """
    Takes the name of a pep file and returns a pep
    project object.

    Uses a temporary directory so file is deleted from
    server after use.
    @param file name of file to be converted into peppy.Project
    """
    with tempfile.TemporaryDirectory() as tmpdirname:
        contents = file.read()
        file_path = f"{tmpdirname}/{file.filename}"
        with open(file_path, mode="wb") as f:
            f.write(contents)
        return peppy.Project(file_path)


router = APIRouter(prefix="/api/v1/eido", tags=["eido"])


@router.get("/filters")
async def list_filters():
    """Return all available filters for eido conversion"""
    return JSONResponse(eido.get_available_pep_filters())


@router.get("/status")
async def status():
    return JSONResponse({"status": "OK"})


@router.get("/schemas")
async def status():
    return JSONResponse(schemas_to_test)


# @router.get("/validate_fromhub/{namespace}/{pep_id}")
# async def validate_fromhub(
#     namespace: str,
#     pep_id: str,
# ):
#     proj = peppy.Project(_PEP_STORES[namespace][pep_id]['cfg_path'])
#     vals = {
#         "name": pep_id,
#         "filenames": "not provided",
#         "peppy_version": peppy_version,
#         "validations": [],
#     }
#     for schema_id, schema_data in schemas_to_test.items():
#         vals["validations"].append(
#             {
#                 "id": schema_id,
#                 "name": schema_data["name"],
#                 "docs": schema_data["docs"],
#                 "schema": schema_data["schema"],
#                 "result": vwrap(proj, schema_data["schema"]),
#             }
#         )
#     return JSONResponse(content=vals)


@router.post("/validate/pep_and_schema")
async def validate_both(pep: UploadFile = File(...), schema: UploadFile = File(...)):
    """
    Takes a locally uploaded PEP and schema and returns a validation response
    """
    with tempfile.TemporaryDirectory() as tmpdirname:
        pep_contents = await pep.read()
        pep_path = f"{tmpdirname}/{pep.filename}"
        async with aiofiles.open(pep_path, mode="wb") as f:
            await f.write(pep_contents)
        project = peppy.Project(pep_path)

        schema_contents = await schema.read()
        schema_path = f"{tmpdirname}/{schema.filename}"
        async with aiofiles.open(schema_path, mode="wb") as f:
            await f.write(schema_contents)
        schema = eido.read_schema(schema_path)

        try:
            response = eido.validate_project(project, schema_path, exclude_case=True)
        except Exception as e:
            response = str(e)
        if response is None:
            response = "valid"

        return {"pep": project, "schema": schema, "response": response}


@router.get("/pep/{namespace}/{project}")
async def pep_fromhub(namespace, project):
    """
    Takes namespace and project values for a PEPhub-hosted pep
    and returns a JSON object.
    """
    response = requests.get(f"http://pephub.databio.org/pep/{namespace}{project}")
    return {"namespace": namespace, "project": project, "response": response.json()}


@router.get("/schemas/{namespace}/{project}")
async def get_schema(request: Request, namespace: str, project: str):
    """
    Takes namespace and project values for a schema endpoint
    and returns a custom validator HTML page.
    """
    # endpoint to schema.databio.org/...
    # like pipelines/ProseqPEP.yaml

    try:
        schema = eido.read_schema(f"http://schema.databio.org/{namespace}/{project}.yaml")[0]
    except IndexError:
        raise HTTPException(status_code=404, detail="Schema not found")

    return schema


@router.post("/validate/pep")
async def validate_pep(
    namespace: str = Form(), project: str = Form(), peps: List[UploadFile] = File(...)
):
    """
    Takes in namespace and project values for a schema and one or more
    local PEP files and returns a JSON object with validation results
    """
    schema = f"http://schema.databio.org/{namespace}/{project}"
    vals = {
        "namespace": namespace,
        "project": project,
        "validations": [],
    }
    with tempfile.TemporaryDirectory() as tmpdirname:
        for pep in peps:
            contents = await pep.read()
            pep_path = f"{tmpdirname}/{pep.filename}"
            print(f"pep_path: '{pep_path}'")
            async with aiofiles.open(pep_path, mode="wb") as f:
                await f.write(contents)
            pep_project = peppy.Project(pep_path)

            responses = []
            for i in range(len(pep_project.samples)):
                required_errors = []
                other_errors = []
                try:
                    eido.validate_sample(pep_project, i, schema, exclude_case=True)
                except Exception as e:
                    for error in e.errors:
                        if "required" in error.message:
                            required_errors.append(
                                error.message.replace(" is a required property", "")
                            )
                        else:
                            other_errors.append(error.message)
                responses.append(
                    {
                        "sample_name": pep_project.samples[i].sample_name,
                        "required_errors": required_errors,
                        "other_errors": other_errors,
                    }
                )

            vals["validations"].append({"pep_name": pep.filename, "samples": responses})

    return JSONResponse(content=vals)


# ! WIP universal endpoint
# @router.post("/validate/test")
# async def validate(pep: str = Form(), schema: str = Form()):
# # async def validate(pep: Union[str, List[UploadFile]] = [Form(), File(...)], schema: Union[str, List[UploadFile]] = [Form(), File(...)]):
#     return {
#         "pep": pep,
#         "schema": schema
#     }


# validate
@router.post("/validate/raw")
async def validate_raw(validation_query: RawValidationQuery):
    error_key_name = "error"
    tmpdirname = "tmp"
    project_config = validation_query.project_config
    sample_table = validation_query.sample_table.rstrip(",")

    # convert to local objects of instantiation
    try:
        project_config_dict = yaml.safe_load(project_config)

        if sample_table is not None:
            # reset sample table path
            project_config_dict["sample_table"] = "sample_table.csv"
            _ = pd.read_csv(StringIO(sample_table))
    except yaml.YAMLError as e:
        raise HTTPException(status_code=406, detail={error_key_name: str(e)})
    except pd.errors.ParserError as e:
        raise HTTPException(status_code=406, detail={error_key_name: str(e)})

    # cleanup any existing temp dir
    try:
        shutil.rmtree(tmpdirname)
    except FileExistsError:
        pass  # ignore if dir doesn't exist
    except FileNotFoundError:
        pass  # ignore if dir doesn't exist
    # save project config and sample table to temp dir
    try:
        os.mkdir(tmpdirname)
        project_path = f"{tmpdirname}/project_config.yaml"
        with open(project_path, mode="w") as f:
            f.write(json.dumps(project_config_dict))

        # write sample table to temp dir if exists
        if sample_table is not None:
            sample_path = f"{tmpdirname}/{project_config_dict['sample_table']}"
            with open(sample_path, mode="w") as f:
                f.write(sample_table)
        try:
            project = peppy.Project(f"{tmpdirname}/project_config.yaml")
        except Exception as e:
            raise HTTPException(status_code=406, detail={error_key_name: str(e)})
    finally:
        # delete the temp dir
        shutil.rmtree(tmpdirname)
    try:
        eido.validate_config(
            project,
            "http://schema.databio.org/pep/2.0.0.yaml",  # just use the base PEP schema for now
            exclude_case=True,
        )
    except Exception as e:
        raise HTTPException(status_code=406, detail={error_key_name: str(e)})

    # validate samples if given
    if sample_table is not None:
        for sample in project.samples:
            try:
                eido.validate_sample(
                    project,
                    sample.sample_name,
                    "http://schema.databio.org/pep/2.0.0.yaml",  # just use the base PEP schema for now
                    exclude_case=True,
                )
            except Exception as e:
                return HTTPException(status_code=406, detail={error_key_name: str(e)})

    return True


@router.get("/")
async def main():
    print(je.list_templates())
    return HTMLResponse(je.get_template("hello.html").render())


# @router.get("/")
# async def main():
#     return HTMLResponse(je.get_template("schema.html").render())


@router.get("/validator")
async def main():
    print(je.list_templates())
    return FileResponse(os.path.join(STATICS_PATH, "index.html"))


@router.get("/validator")
async def main():
    print(je.list_templates())
    return FileResponse(os.path.join(STATICS_PATH, "schemas.html"))


# NEW STUFF FOR REACT FRONTEND
@router.post("/validate")
async def validate(
    pep: Union[str, List[UploadFile]] = [Form(), File(...)], schema: str = Form(), agent: PEPDatabaseAgent = Depends(get_db),
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
    if isinstance(pep, str):
        # split into namespace, name, tag
        namespace, name_tag = pep.split("/")
        name, tag = name_tag.split(":")
        p = agent.project.get(namespace, name, tag)
    else:
        init_file = parse_user_file_upload(pep)
        init_file, other_files = split_upload_files_on_init_file(pep, init_file)

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

        # save schema to disk and read in with tempdir
        with tempfile.NamedTemporaryFile(mode="w", delete=False) as schema_fh:
            schema_fh.write(schema)
            schema_path = schema_fh.name

            # load with eido
            try:
                schema = eido.read_schema(schema_path)
            except eido.exceptions.EidoSchemaInvalidError as e:
                raise HTTPException(
                    status_code=406, detail={"error": f"Schema is invalid: {str(e)}"}
            )

    # validate
    try:
        eido.validate_config(p, schema, exclude_case=True)
    # while we catch this, its still a 200 response since we want to
    # return the validation errors
    except eido.exceptions.EidoValidationError as e:
        return {
            "valid": False,
            "errors": str(e)
        }
    except Exception as e:
        raise HTTPException(
            status_code=406,
            detail={"error": f"Unknown error while validating: {str(e)}"},
        )
    # everything passed, return valid
    finally:
        # return project is valid
        return {
            "valid": True,
            "errors": None
        }
