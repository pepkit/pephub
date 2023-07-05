import tempfile
import shutil

import peppy
from fastapi import APIRouter, File, UploadFile, Request, Depends, Form, Body
from fastapi.responses import JSONResponse
from peppy import Project
from pepdbagent.exceptions import ProjectUniqueNameError

from ....dependencies import *
from ....helpers import parse_user_file_upload, split_upload_files_on_init_file
from ....const import (
    DEFAULT_TAG,
    BLANK_PEP_CONFIG,
    BLANK_PEP_SAMPLE_TABLE,
    DEFAULT_PEP_SCHEMA,
)
from ...models import ProjectRawModel, ProjectJsonRequest

from dotenv import load_dotenv

load_dotenv()

namespace = APIRouter(prefix="/api/v1/namespaces/{namespace}", tags=["namespace"])


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
    session_info: dict = Depends(read_authorization_header),
    user_orgs: List[str] = Depends(get_organizations_from_session_info),
    namespace_access: List[str] = Depends(get_namespace_access_list),
    order_by: str = "update_date",
    order_desc: bool = False,
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
            order_by=order_by,
            order_desc=order_desc,
        )
    else:
        search_result = agent.annotation.get(
            namespace=namespace,
            limit=limit,
            offset=offset,
            admin=namespace_access,
            order_by=order_by,
            order_desc=order_desc,
        )
    results = [p.dict() for p in search_result.results]

    return JSONResponse(
        content={
            "count": search_result.count,
            "limit": limit,
            "offset": offset,
            "items": results,
            "session_info": session_info,
            "can_edit": user == namespace or namespace in user_orgs,
        }
    )


# url format based on:
# * github: https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#create-a-repository-for-the-authenticated-user
# * spotify: https://developer.spotify.com/documentation/web-api/reference-beta/#endpoint-create-playlist
@namespace.post(
    "/projects/files",
    summary="Create a PEP in the current namespace",
    dependencies=[Depends(verify_user_can_write_namespace)],
)
async def create_pep(
    namespace: str,
    name: str = Form(...),
    is_private: bool = Form(False),
    tag: str = Form(DEFAULT_TAG),
    description: Union[str, None] = Form(None),
    pep_schema: str = Form(DEFAULT_PEP_SCHEMA),
    files: Optional[List[UploadFile]] = File(
        None  # let the file upload be optional. dont send a file? We instantiate with blank
    ),
    agent: PEPDatabaseAgent = Depends(get_db),
):
    if files is not None:
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
            p.name = name
            p.description = description
            p.pep_schema = pep_schema
            try:
                agent.project.create(
                    p,
                    namespace=namespace,
                    name=name,
                    tag=tag,
                    is_private=is_private,
                    pep_schema=pep_schema,
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
                    "name": name,
                    "proj": p.to_dict(),
                    "init_file": init_file.filename,
                    "tag": tag,
                    "registry_path": f"{namespace}/{name}:{tag}",
                },
                status_code=202,
            )
    # create a blank peppy.Project object with fake files
    else:
        # create temp dir that gets deleted when we're done
        with tempfile.TemporaryDirectory() as dirpath:
            config_file_name = "project_config.yaml"
            sample_table_name = BLANK_PEP_CONFIG["sample_table"]

            # create 'empty' config and sample table files
            with open(f"{dirpath}/{config_file_name}", "w") as cfg_fh:
                cfg_fh.write(json.dumps(BLANK_PEP_CONFIG))
            with open(f"{dirpath}/{sample_table_name}", "w") as cfg_fh:
                cfg_fh.write(BLANK_PEP_SAMPLE_TABLE)

            # init project
            p = Project(f"{dirpath}/{config_file_name}")
            p.name = name
            p.description = description
            p.pep_schema = pep_schema
            try:
                agent.project.create(
                    p,
                    namespace=namespace,
                    name=name,
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
                    "name": name,
                    "proj": p.to_dict(),
                    "tag": tag,
                    "registry_path": f"{namespace}/{name}:{tag}",
                },
                status_code=202,
            )


@namespace.post(
    "/projects/json",
    summary="Upload raw project to database.",
    dependencies=[Depends(verify_user_can_write_namespace)],
)
async def upload_raw_pep(
    namespace: str,
    project_from_json: ProjectJsonRequest,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    try:
        is_private = project_from_json.is_private
        tag = project_from_json.tag
        overwrite = project_from_json.overwrite
        pep_schema = project_from_json.pep_dict.pep_schema

        # This configurations needed due to Issue #124 Should be removed in the future
        project_dict = ProjectRawModel(**project_from_json.pep_dict.dict())
        p_project = peppy.Project().from_dict(project_dict.dict(by_alias=True))

        # for DX, we want people to be able to just send name and description,
        # although it is required in the peppy.Project config, so we set it here
        if project_from_json.name is not None:
            p_project.name = project_from_json.name
        if project_from_json.description is not None:
            p_project.description = project_from_json.description

    except Exception as e:
        return JSONResponse(
            content={
                "message": f"Incorrect raw project was provided. Couldn't initiate peppy object.",
                "error": f"{e}",
                "status_code": 417,
            },
            status_code=417,
        )
    try:
        agent.project.create(
            p_project,
            namespace=namespace,
            name=p_project.name,
            tag=tag,
            is_private=is_private,
            overwrite=overwrite,
            pep_schema=pep_schema,
        )
    except ProjectUniqueNameError:
        return JSONResponse(
            content={
                "message": f"Project '{namespace}/{p_project.name}:{tag}' already exists in namespace",
                "error": f"Set overwrite=True to overwrite or update project",
                "status_code": 409,
            },
            status_code=409,
        )
    return JSONResponse(
        content={
            "namespace": namespace,
            "name": p_project.name,
            "tag": tag,
            "registry_path": f"{namespace}/{p_project.name}:{tag}",
        },
        status_code=202,
    )
