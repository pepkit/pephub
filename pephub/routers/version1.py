import jinja2
import shutil
import tempfile
from typing import List
from fastapi import APIRouter, Depends, Form, UploadFile, File
from fastapi.responses import RedirectResponse
from platform import python_version
from starlette.requests import Request
from starlette.templating import Jinja2Templates

from .._version import __version__ as pephub_version
from ..const import BASE_TEMPLATES_PATH
from ..dependencies import read_session_info

import peppy

# load dependencies
from ..dependencies import *

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(BASE_TEMPLATES_PATH))

router = APIRouter(
    tags=["root"],
)

ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peppy_version": peppy.__version__,
    "python_version": python_version(),
}


@router.get("/")
async def main(request: Request, db: Connection = Depends(get_db), session_info: dict = Depends(read_session_info)):
    templ_vars = {"request": request}
    namespaces = db.get_namespaces_info_by_list()
    return templates.TemplateResponse(
        "index.html",
        dict(
            templ_vars,
            **ALL_VERSIONS,
            namespaces=namespaces,
            session_info=session_info,
            logged_in=session_info is not None
        ),
    )

@router.get("/_version")
async def version():
    return dict(**ALL_VERSIONS)

# @router.get("/pep-list")
# async def pep_list():
#     namespaces = _PEP_STORES.get_namespaces()
#     return [
#         dict(
#             **n,
#             projects=_PEP_STORES.get_projects(n['name']))
#             for n in namespaces
#     ]

@router.post("/submit", summary="Submit a PEP to the current namespace")
async def submit_pep(
    request: Request,
    namespace: str,
    session_info: dict = Depends(read_session_info),
    project_name: str = Form(...),
    tag: str = Form(...),
    config_file: UploadFile = File(...),
    other_files: List[UploadFile] = File(...),
    db: Connection = Depends(get_db),
):
    if session_info is None:
        raise HTTPException(403, "Please log in to submit a PEP.")
        
    if os.getenv("SERVER_ENV") != "development":
        raise HTTPException(403, "Submitting new PEPs is not presently an allowed feature.")

    # create temp dir that gets deleted
    # after endpoint execution ends
    with tempfile.TemporaryDirectory() as dirpath:
        # save config file in tmpdir
        with open(f"{dirpath}/{config_file.filename}", "wb") as cfg_fh:
            shutil.copyfileobj(config_file.file, cfg_fh)

        # save any other files the user might have supplied
        for upload_file in other_files:
            # open new file inside the tmpdir
            with open(f"{dirpath}/{upload_file.filename}", "wb") as local_tmpf:
                shutil.copyfileobj(upload_file.file, local_tmpf)

        p = peppy.Project(f"{dirpath}/{config_file.filename}")
        p.name = project_name
        db.upload_project(p, namespace=namespace, name=project_name, tag=tag)
        return templates.TemplateResponse(
            "submission.html",
            {
                "request": request,
                "namespace": namespace,
                "project_name": project_name,
                "proj": p.to_dict(),
                "config_file": config_file.filename,
                "other_files": [f.filename for f in other_files],
            }
        )

@router.get("/submit", summary="Submit a PEP to the current namespace")
async def submit_pep_form(
    request: Request,
    session_info = Depends(read_session_info)
):  
    if session_info is not None:
        return templates.TemplateResponse(
            "submit.html",
            {
                "namespace": session_info['user'],
                "session_info": session_info,
                "logged_in": session_info is not None,
                "request": request,
                "peppy_version": peppy.__version__,
                "python_version": python_version(),
                "pephub_version": pephub_version,
            },
        )
    else:
        return RedirectResponse(url="/auth/login")