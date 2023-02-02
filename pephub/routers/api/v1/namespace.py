import tempfile
import shutil

from fastapi import APIRouter, File, UploadFile, Request, Depends, Form
from fastapi.responses import JSONResponse
from peppy import __version__ as peppy_version
from peppy import Project
from pepdbagent.exceptions import ProjectUniqueNameError
from platform import python_version

from ...._version import __version__ as pephub_version
from ....dependencies import *
from ....helpers import parse_user_file_upload, split_upload_files_on_init_file


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
    request: Request,
    nspace: Namespace = Depends(get_namespace_info),
):
    """
    Fetch namespace. Returns a JSON representation of the namespace.
    """
    nspace = nspace.dict()
    nspace["projects_endpoint"] = f"{str(request.url)[:-1]}/projects"
    return JSONResponse(content=nspace)


@namespace.get("/projects", summary="Fetch all projects inside a particular namespace.")
async def get_namespace_projects(
    namespace: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    limit: int = 10,
    offset: int = 0,
    user=Depends(get_user_from_session_info),
    q: str = None,
    session_info: dict = Depends(read_session_info),
    user_orgs: List[str] = Depends(get_organizations_from_session_info),
    namespace_access: List[str] = Depends(get_namespace_access_list),
):
    """
    Fetch the projects for a particular namespace
    """

    # TODO, this API will change. Searching
    # through a namespace for projects doesnt make sense
    # get projects in namespace
    if q is not None:
        search_result = agent.annotation.get(
            query=q,
            namespace=namespace,
            limit=limit,
            offset=offset,
            admin=namespace_access,
        )
    else:
        search_result = agent.annotation.get(
            namespace=namespace, limit=limit, offset=offset, admin=namespace_access
        )

    return JSONResponse(
        content={
            "count": search_result.count,
            "limit": limit,
            "offset": offset,
            "items": [p.dict() for p in search_result.results],
            "session_info": session_info,
            "can_edit": user == namespace or namespace in user_orgs,
        }
    )


# url format based on:
# * github: https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#create-a-repository-for-the-authenticated-user
# * spotify: https://developer.spotify.com/documentation/web-api/reference-beta/#endpoint-create-playlist
@namespace.post(
    "/projects",
    summary="Create a PEP in the current namespace",
    dependencies=[Depends(verify_user_can_write_namespace)],
)
async def submit_pep(
    namespace: str,
    project_name: str = Form(...),
    is_private: bool = Form(False),
    tag: str = Form(DEFAULT_TAG),
    files: List[UploadFile] = File(...),
    agent: PEPDatabaseAgent = Depends(get_db),
):
    init_file = parse_user_file_upload(files)
    init_file, other_files = split_upload_files_on_init_file(files, init_file)

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

        p = Project(f"{dirpath}/{init_file.filename}")
        p.name = project_name
        try:
            agent.project.create(
                p,
                namespace=namespace,
                name=project_name,
                tag=tag,
                is_private=is_private,
            )
        except ProjectUniqueNameError as e:
            return JSONResponse(
                content={
                    "message": f"Project '{namespace}/{p.name}:{tag}' already exists in namespace",
                    "error": f"{e}",
                    "status_code": 400,
                },
                status_code=400,
            )
        return JSONResponse(
            content={
                "namespace": namespace,
                "project_name": project_name,
                "proj": p.to_dict(),
                "init_file": init_file.filename,
                "tag": tag,
                "registry_path": f"{namespace}/{project_name}:{tag}",
            },
            status_code=202,
        )
