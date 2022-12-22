import tempfile
import shutil
from fastapi import APIRouter, File, UploadFile, Request, Depends, Form
from fastapi.responses import JSONResponse
from peppy import __version__ as peppy_version
from peppy import Project
from platform import python_version

from ...._version import __version__ as pephub_version
from ....dependencies import *


from dotenv import load_dotenv

load_dotenv()

ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peppy_version": peppy_version,
    "python_version": python_version(),
    "api_version": 1,
}

namespace = APIRouter(
    prefix="/api/v1/namespaces/{namespace}", tags=["api", "namespace", "v1"]
)


@namespace.get("/", summary="Fetch details about a particular namespace.")
async def get_namespace(
    namespace: str,
    request: Request,
    db: Connection = Depends(get_db),
    user: str = Depends(get_user_from_session_info),
):
    """
    Fetch namespace. Returns a JSON representation of the namespace.
    """
    nspace = db.get_namespace_info(namespace=namespace, user=user)
    nspace = nspace.dict()
    # return namespace not found if no projects
    if len(nspace["projects"]) == 0:
        raise HTTPException(404, f"Namespace {namespace} not found.")

    nspace["projects_endpoint"] = f"{str(request.url)[:-1]}/projects"
    return JSONResponse(content=nspace)


@namespace.get("/projects", summary="Fetch all projects inside a particular namespace.")
async def get_namespace_projects(
    namespace: str,
    db: Connection = Depends(get_db),
    limit: int = 10,
    offset: int = 0,
    user=Depends(get_user_from_session_info),
    q: str = None,
    session_info: dict = Depends(read_session_info),
):
    """
    Fetch the projects for a particular namespace
    """

    # get projects in namespace
    search_result = db.search.project(
        namespace=namespace,
        limit=limit,
        offset=offset,
        admin=(user == namespace),
        search_str=q or "",
    )

    return JSONResponse(
        content={
            "count": search_result.number_of_results,
            "limit": limit,
            "offset": offset,
            "items": [p.dict() for p in search_result.results],
            "session_info": session_info,
        }
    )


# url format based on:
# * github: https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#create-a-repository-for-the-authenticated-user
# * spotify: https://developer.spotify.com/documentation/web-api/reference-beta/#endpoint-create-playlist
@namespace.post("/projects", summary="Submit a PEP to the current namespace")
async def submit_pep(
    request: Request,
    namespace: str,
    session_info: dict = Depends(read_session_info),
    project_name: str = Form(...),
    tag: str = Form(DEFAULT_TAG),
    config_file: UploadFile = File(...),
    other_files: List[UploadFile] = File(None),
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
        if other_files is not None:
            for upload_file in other_files:
                # open new file inside the tmpdir
                with open(f"{dirpath}/{upload_file.filename}", "wb") as local_tmpf:
                    shutil.copyfileobj(upload_file.file, local_tmpf)

        p = Project(f"{dirpath}/{config_file.filename}")
        p.name = project_name
        db.upload_project(p, namespace=namespace, name=project_name, tag=tag)
        return JSONResponse(
            content={
                "namespace": namespace,
                "project_name": project_name,
                "proj": p.to_dict(),
                "config_file": config_file.filename if config_file else None,
                "other_files": [f.filename for f in other_files] if other_files else [],
                "tag": tag,
                "registry_path": f"{namespace}/{project_name}:{tag}",
            },
            status_code=202,
        )
