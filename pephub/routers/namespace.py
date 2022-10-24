import shutil
import tempfile
from typing import List
from fastapi import APIRouter, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from pephub.const import BASE_TEMPLATES_PATH
from peppy import __version__ as peppy_version, Project
from platform import python_version

from .._version import __version__ as pephub_version

from ..dependencies import *


from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/pep/{namespace}", tags=["namespace"])

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)


@router.get("/", summary="Fetch details about a particular namespace.")
async def get_namespace(
    namespace: str,
    db: Connection = Depends(get_db),
    user=Depends(get_user_from_namespace_info),
):
    """Fetch namespace. Returns a JSON representation of the namespace."""
    nspace = db.get_namespace_info(namespace, user)
    return JSONResponse(content=nspace.dict())


@router.get("/projects", summary="Fetch all projects inside a particular namespace.")
async def get_namespace_projects(
    namespace: str,
    db: Connection = Depends(get_db),
    limit: int = 100,
    user=Depends(get_user_from_namespace_info),
):
    """Fetch the projects for a particular namespace"""
    projects = db.get_projects_in_namespace(user=user, namespace=namespace)
    if limit:
        return JSONResponse(content={p.name: p.to_dict() for p in projects[:limit]})
    else:
        return JSONResponse(content=projects)


@router.get(
    "/view",
    summary="View a visual summary of a particular namespace.",
    response_class=HTMLResponse,
)
async def namespace_view(
    request: Request,
    namespace: str,
    db: Connection = Depends(get_db),
    user=Depends(get_user_from_namespace_info),
):
    """Returns HTML response with a visual summary of the namespace."""
    nspace = db.get_namespace_info(namespace, user)
    return templates.TemplateResponse(
        "namespace.html",
        {
            "namespace": nspace,
            "request": request,
            "peppy_version": peppy_version,
            "python_version": python_version(),
            "pephub_version": pephub_version,
            "logged_in": user is not None,
        },
    )


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

        p = Project(f"{dirpath}/{config_file.filename}")
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
                "tag": tag,
            },
        )
