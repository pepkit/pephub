import eido
import jinja2
import os 
import peppy
import shutil

from fastapi import  File, UploadFile
from fastapi import APIRouter, Depends
from peppy import __version__ as peppy_version
from starlette.requests import Request
from starlette.responses import HTMLResponse
from starlette.responses import JSONResponse
from starlette.responses import FileResponse 
from starlette.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates
from typing import List
from yacman import load_yaml

from ..const import EIDO_TEMPLATES_PATH, STATICS_PATH
from ..dependencies import *
from ..main import _PEP_STORES

templates = Jinja2Templates(directory=EIDO_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(EIDO_TEMPLATES_PATH))

path_to_schemas = f"{os.path.dirname(__file__)}/schemas.yaml"
try:
    print(load_yaml(path_to_schemas))
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


router = APIRouter(
    prefix="/eido",
    tags=["eido"]
)


@router.get("/status")
async def status(request: Request):
    return JSONResponse({"status": "OK"})


@router.get("/schemas")
async def status(request: Request):
    return JSONResponse(schemas_to_test)


@router.get("/validate_fromhub/{namespace}/{pep_id}")
async def validate_fromhub(namespace: str, pep_id: str,):
    proj = peppy.Project(_PEP_STORES[namespace][pep_id])
    vals = {
        "name": pep_id,
        "filenames": "not provided",
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
                "result": vwrap(proj, schema_data["schema"]),
            }
        )
    return JSONResponse(content=vals)


@router.post("/validate")
async def validate_pep(request: Request, files: List[UploadFile] = File(...), schemas_to_test = schemas_to_test):
    ufiles = []
    upload_folder = "uploads"
    for file in files:
        print(f"File: '{file}'")
        file_object = file.file
        full_path = os.path.join(upload_folder, file.filename)
        # if not os.path.isfile(full_path):
        #     print(f"failed isfile test: {full_path}")
        #     return JSONResponse(content={ "error": "No files provided."})
        uploaded = open(full_path, "wb+")
        shutil.copyfileobj(file_object, uploaded)
        uploaded.close()
        print(uploaded.name)
        f, ext = os.path.splitext(file.filename)
        print(ext)
        if ext == ".yaml" or ext == ".yml" or ext == ".csv":
            pconf = uploaded.name
            print("Got yaml:", pconf)
    print(pconf)
    p = peppy.Project(pconf)
    print(p)

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


# @router.get("/")
# async def main():
#     print(je.list_templates())
#     return HTMLResponse(je.get_template("index.html").render())

@router.get("/validator")
async def main():
    print(je.list_templates())
    return FileResponse(os.path.join(STATICS_PATH, "validator.html"))

