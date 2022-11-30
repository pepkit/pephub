import eido
import jinja2
import shutil
import aiofiles
import requests
import tempfile

from fastapi import File, UploadFile, Form, APIRouter
from fastapi.responses import HTMLResponse
from peppy import __version__ as peppy_version
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.responses import FileResponse
from starlette.templating import Jinja2Templates
from typing import List, Union
from yacman import load_yaml

from ..const import EIDO_TEMPLATES_PATH, STATICS_PATH
from ..dependencies import *

templates = Jinja2Templates(directory=EIDO_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(EIDO_TEMPLATES_PATH))

path_to_schemas = f"{os.path.dirname(__file__)}/schemas.yaml"
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


router = APIRouter(prefix="/eido", tags=["eido"])


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


@router.get("/schema/{namespace}/{project}", response_class=HTMLResponse)
async def get_schema(request: Request, namespace: str, project: str):
    """
    Takes namespace and project values for a schema endpoint
    and returns a custom validator HTML page.
    """
    # endpoint to schema.databio.org/...
    # like pipelines/ProseqPEP.yaml

    schema = eido.read_schema(f"http://schema.databio.org/{namespace}/{project}")

    return templates.TemplateResponse(
        "schema.html",
        {
            "request": request,
            "namespace": namespace,
            "project": project,
            "schema": schema,
        },
    )


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


# ! old /validate
@router.post("/validate")
async def validate_pep(
    request: Request,
    files: List[UploadFile] = File(...),
    schemas_to_test=schemas_to_test,
):
    for file in files:
        print(f"File: '{file}'")
        file_object = file.file
        full_path = os.path.join(file.filename)
        uploaded = open(full_path, "wb+")
        shutil.copyfileobj(file_object, uploaded)
        uploaded.close()
        print(uploaded.name)
        f, ext = os.path.splitext(file.filename)
        print(ext)
        if ext == ".yaml" or ext == ".yml" or ext == ".csv":
            pconf = uploaded.name
            print("Got yaml:", pconf)
    p = peppy.Project(pconf)

    vals = {
        "name": pconf,
        "filenames": [file.filename for file in files],
        "peppy_version": peppy_version,
        "validations": [],
    }
    for schema_id, schema_data in schemas_to_test.items():
        vals["validations"].append(
            {
                "id": schema_id,
                "name": schema_data["name"],
                "docs": schema_data["docs"],
                "schema": schema_data["schema"],
                "result": vwrap(p, schema_data["schema"]),
            }
        )
    return JSONResponse(content=vals)
    # return HTMLResponse(je.get_template("validation_results.html").render(**vals))


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
    return FileResponse(os.path.join(STATICS_PATH, "index2.html"))
