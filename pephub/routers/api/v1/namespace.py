import shutil
import tempfile
from typing import List, Literal, Optional, Union
import os

import peppy
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pepdbagent import PEPDatabaseAgent
from pepdbagent.const import DEFAULT_LIMIT_INFO
from pepdbagent.exceptions import (
    NamespaceNotFoundError,
    ProjectAlreadyInFavorites,
    ProjectNotInFavorites,
    ProjectUniqueNameError,
    UserNotFoundError,
)
from pepdbagent.models import (
    AnnotationList,
    ListOfNamespaceInfo,
    Namespace,
    NamespaceStats,
    TarNamespaceModelReturn,
)
from peppy import Project
from peppy.const import DESC_KEY, NAME_KEY
from typing_extensions import Annotated

from ....const import (
    DEFAULT_TAG,
    ARCHIVE_URL_PATH,
)
from ....dependencies import (
    get_db,
    get_namespace_access_list,
    get_namespace_info,
    get_user_from_session_info,
    verify_user_can_write_namespace,
    get_pepdb_namespace_info,
)
from ....helpers import parse_user_file_upload, split_upload_files_on_init_file
from ...models import FavoriteRequest, ProjectJsonRequest, ProjectRawModel

from attribute_standardizer import AttrStandardizer

load_dotenv()

namespaces = APIRouter(prefix="/api/v1/namespaces", tags=["namespace"])
namespace = APIRouter(prefix="/api/v1/namespaces/{namespace}", tags=["namespace"])


@namespace.get(
    "/",
    summary="Fetch details about a particular namespace.",
    response_model=Namespace,
)
async def get_namespace(
    namespace_info: Namespace = Depends(get_namespace_info),
):
    """
    Fetch namespace. Returns a JSON representation of the namespace.

    Don't have a namespace?

    Use the following:

        namespace: databio
    """
    return namespace_info


@namespace.get(
    "/projects",
    summary="Fetch all projects inside a particular namespace.",
    response_model=AnnotationList,
)
async def get_namespace_projects(
    namespace: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    limit: int = 10,
    offset: int = 0,
    query: str = None,
    admin_list: List[str] = Depends(get_namespace_access_list),
    order_by: str = "update_date",
    order_desc: bool = False,
    filter_by: Annotated[
        Optional[Literal["submission_date", "last_update_date"]],
        "filter projects by submission or update date",
    ] = None,
    filter_start_date: Annotated[Optional[str], "Date format: YYYY/MM/DD"] = None,
    filter_end_date: Annotated[Optional[str], "Date format: YYYY/MM/DD"] = None,
    pep_type: Optional[Literal["pep", "pop"]] = None,
):
    """
    Fetch the projects for a particular namespace

    Don't have a namespace?

    Use the following:

        namespace: databio
    """
    # through a namespace for projects doesnt make sense
    # get projects in namespace
    if query is not None:
        search_result = agent.annotation.get(
            query=query,
            namespace=namespace,
            limit=limit,
            offset=offset,
            admin=admin_list,
            order_by=order_by,
            order_desc=order_desc,
            filter_by=filter_by,
            filter_start_date=filter_start_date,
            filter_end_date=filter_end_date,
            pep_type=pep_type,
        )
    else:
        search_result = agent.annotation.get(
            namespace=namespace,
            limit=limit,
            offset=offset,
            admin=admin_list,
            order_by=order_by,
            order_desc=order_desc,
            filter_by=filter_by,
            filter_start_date=filter_start_date,
            filter_end_date=filter_end_date,
            pep_type=pep_type,
        )

    return search_result


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
    pep_schema: str = Form(None),
    files: List[UploadFile] = File(
        None  # let the file upload be optional. dont send a file? We instantiate with blank
    ),
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Create a PEP for a particular namespace you have write access to.

    Don't know your namespace? Log in to see.
    """

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
                    description=description,
                    is_private=is_private,
                    pep_schema=pep_schema,
                )
            except ProjectUniqueNameError:
                raise HTTPException(
                    detail=f"Project '{namespace}/{p.name}:{tag}' already exists in namespace",
                    status_code=400,
                )
            return JSONResponse(
                content={
                    "namespace": namespace,
                    "name": name,
                    "tag": tag,
                    "registry_path": f"{namespace}/{name}:{tag}",
                },
                status_code=202,
            )
    # create a blank peppy.Project object with fake files
    else:
        raise HTTPException(
            detail="Project files were not provided",
            status_code=400,
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
    """
    Upload a raw project for a particular namespace you have write access to.

    Don't know your namespace? Log in to see.

    """
    try:
        is_private = project_from_json.is_private
        tag = project_from_json.tag
        overwrite = project_from_json.overwrite
        pep_schema = project_from_json.pep_schema
        pop = project_from_json.pop or False
        if hasattr(project_from_json, NAME_KEY):
            if project_from_json.name:
                name = project_from_json.name
            else:
                name = project_from_json.pep_dict.config.get(NAME_KEY)
        else:
            name = project_from_json.pep_dict.config.get(NAME_KEY)
        if hasattr(project_from_json, DESC_KEY):
            description = project_from_json.description
        else:
            description = project_from_json.pep_dict.config.get(DESC_KEY)

        # This configurations needed due to Issue #124 Should be removed in the future
        project_dict = ProjectRawModel(**project_from_json.pep_dict.dict())
        ff = project_dict.model_dump(by_alias=True)
        p_project = peppy.Project().from_dict(ff)

        p_project.namespace = name
        p_project.description = description

    except Exception as e:
        raise HTTPException(
            detail=f"Incorrect raw project was provided. Couldn't initiate peppy object: {e}",
            status_code=417,
        )
    try:
        agent.project.create(
            p_project,
            namespace=namespace,
            name=p_project.namespace,
            tag=tag,
            description=description,
            is_private=is_private,
            overwrite=overwrite,
            pep_schema=pep_schema,
            pop=pop,
        )
    except ProjectUniqueNameError:
        raise HTTPException(
            detail=f"Project '{namespace}/{p_project.namespace}:{tag}' already exists in namespace",
            status_code=400,
        )
    return JSONResponse(
        content={
            "namespace": namespace,
            "name": p_project.namespace,
            "tag": tag,
            "registry_path": f"{namespace}/{p_project.namespace}:{tag}",
        },
        status_code=202,
    )


# favorites endpoints
@namespace.get(
    "/stars",
    summary="Get information about user favorite projects.",
    dependencies=[Depends(verify_user_can_write_namespace)],
    response_model=AnnotationList,
)
async def get_user_stars(
    namespace: str,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Get information about user favorite projects.
    """
    return agent.user.get_favorites(namespace=namespace)


@namespace.post(
    "/stars",
    summary="Add project to favorites.",
    dependencies=[
        Depends(verify_user_can_write_namespace),
    ],
)
async def add_to_stars(
    project: FavoriteRequest,
    namespace: str,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Add project to favorites
    """
    try:
        agent.user.add_project_to_favorites(
            namespace=namespace,
            project_namespace=project.namespace,
            project_name=project.name,
            project_tag=project.tag,
        )
        return JSONResponse(
            content={
                "namespace": namespace,
                "registry_path": f"{project.namespace}/{project.name}:{project.tag}",
                "message": "PEP was added to favorites.",
            },
            status_code=202,
        )
    except ProjectAlreadyInFavorites as _:
        raise HTTPException(
            status_code=400,
            detail="PEP already in favorites.",
        )


@namespace.delete(
    "/stars",
    summary="Delete project from favorites.",
    dependencies=[Depends(verify_user_can_write_namespace)],
)
async def remove_from_stars(
    project: FavoriteRequest,
    namespace: str,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Add project to favorites
    """
    try:
        agent.user.remove_project_from_favorites(
            namespace=namespace,
            project_namespace=project.namespace,
            project_name=project.name,
            project_tag=project.tag,
        )
        return JSONResponse(
            content={
                "message": "PEP was removed from favorites.",
                "namespace": namespace,
                "registry": f"{project.namespace}/{project.name}:{project.tag}",
            },
            status_code=202,
        )
    except ProjectNotInFavorites as _:
        raise HTTPException(
            status_code=400,
            detail="PEP not in favorites.",
        )


@namespaces.get(
    "/info",
    summary="Get information list of biggest namespaces",
    response_model=ListOfNamespaceInfo,
)
async def get_namespace_information(
    limit: Optional[int] = DEFAULT_LIMIT_INFO,
) -> ListOfNamespaceInfo:
    return get_pepdb_namespace_info(limit)


@namespaces.get(
    "/stats",
    summary="Get statistics about each namespace",
    response_model=NamespaceStats,
)
async def get_namespace_stats(
    agent: PEPDatabaseAgent = Depends(get_db),
    namespace: Optional[str] = None,
):
    try:
        return agent.namespace.stats(namespace=namespace)
    except NamespaceNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Namespace '{namespace}' not found.",
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Internal server error. Unexpected return value. Error: 500",
        )


@namespace.delete(
    "/",
    summary="Delete user projects and stars from pephub",
)
def remove_user(
    namespace: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    user_name: str = Depends(get_user_from_session_info),
):
    """
    Delete user related projects and stars from pephub
    """
    if user_name != namespace:
        raise HTTPException(
            status_code=403,
            detail="Access denied. You can only delete your own namespace.",
        )
    try:
        agent.user.delete(namespace)
    except UserNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Namespace '{namespace}' not found.",
        )
    return JSONResponse(
        content={
            "message": f"Namespace {namespace} has been deleted.",
        },
        status_code=202,
    )


@namespace.get(
    "/archive",
    summary="Get metadata of all archived files of all projects in the namespace",
    response_model=TarNamespaceModelReturn,
)
async def get_archive(namespace: str, agent: PEPDatabaseAgent = Depends(get_db)):

    result = agent.namespace.get_tar_info(namespace)

    for item in result.results:
        item.file_path = os.path.join(ARCHIVE_URL_PATH, item.file_path)

    return result


@namespace.get(
    "/standardizer_schemas",
    summary="Get metadata of all archived files of all projects in the namespace",
)
async def get_schemas(namespace: str, agent: PEPDatabaseAgent = Depends(get_db)):

    model = AttrStandardizer("ENCODE")
    schemas = model.get_available_schemas()

    return schemas
