from typing import Optional, Union, Literal
from starlette.responses import Response

import yaml
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from pepdbagent import PEPDatabaseAgent
from pepdbagent.exceptions import (
    SchemaDoesNotExistError,
    SchemaAlreadyExistsError,
    SchemaGroupDoesNotExistError,
    SchemaGroupAlreadyExistsError,
)
import yaml.parser
import yaml.scanner

from pepdbagent.models import (
    SchemaSearchResult,
    SchemaGroupSearchResult,
    SchemaGroupAnnotation,
)

from ...models import (
    SchemaCreateRequest,
    SchemaUpdateRequest,
    SchemaGroupCreateRequest,
    SchemaGroupAssignRequest,
    SchemaGetResponse,
)
from ....helpers import download_yaml
from ....dependencies import (
    get_db,
    get_namespace_access_list,
    get_user_from_session_info,
)

load_dotenv()

groups = APIRouter(prefix="/api/v1/schema-groups", tags=["groups"])
schemas = APIRouter(prefix="/api/v1/schemas", tags=["schemas"])


@schemas.get("", response_model=SchemaSearchResult)
async def get_all_schemas(
    query: Optional[str] = None,
    limit: Optional[int] = 100,
    offset: Optional[int] = 0,
    order_by: str = "update_date",
    order_desc: bool = False,
    namespace: Optional[str] = None,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    result = agent.schema.search(
        namespace=namespace,
        search_str=query,
        limit=limit,
        offset=offset,
        order_by=order_by,
        order_desc=order_desc,
    )
    return result


@schemas.get("/{namespace}", response_model=SchemaSearchResult)
async def get_schemas_in_namespace(
    namespace: str,
    query: Optional[str] = None,
    limit: Optional[int] = 100,
    offset: Optional[int] = 0,
    agent: PEPDatabaseAgent = Depends(get_db),
    order_by: str = "update_date",
    order_desc: bool = False,
):
    result = agent.schema.search(
        namespace=namespace,
        search_str=query,
        limit=limit,
        offset=offset,
        order_by=order_by,
        order_desc=order_desc,
    )
    return result


@schemas.post("/{namespace}/json")
async def create_schema_for_namespace(
    namespace: str,
    new_schema: SchemaCreateRequest,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403, detail="You do not have permission to create this schema"
        )

    # parse out the schema into a dictionary
    try:
        schema_str = new_schema.schema
        schema_dict = yaml.safe_load(schema_str)
        agent.schema.create(
            namespace=namespace,
            name=new_schema.name,
            description=new_schema.description,
            schema=schema_dict,
            overwrite=False,
            update_only=False,
        )
        return {
            "message": "Schema created successfully",
        }

    except SchemaAlreadyExistsError:
        raise HTTPException(
            status_code=409,
            detail=f"Schema {new_schema.name}/{namespace} already exists.",
        )
    except yaml.parser.ParserError as e:
        raise HTTPException(
            status_code=400,
            detail=f"The was an error parsing the yaml: {e}",
        )


@schemas.post("/{namespace}/file")
async def create_schema_for_namespace_by_file(
    namespace: str,
    name: Optional[str] = Form(...),
    schema_file: UploadFile = File(...),
    description: Optional[str] = Form(default=None),
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403, detail="You do not have permission to create this schema"
        )

    # parse out the schema into a dictionary
    try:
        schema_str = schema_file.file.read().decode("utf-8")
        schema_dict = yaml.safe_load(schema_str)
        schema_name = name or schema_file.filename

        agent.schema.create(
            namespace=namespace,
            name=schema_name,
            description=description,
            schema=schema_dict,
            overwrite=False,
            update_only=False,
        )

        return {
            "message": "Schema created successfully",
        }

    except SchemaAlreadyExistsError:
        raise HTTPException(
            status_code=409,
            detail=f"Schema {schema_name}/{namespace} already exists.",
        )
    except yaml.parser.ParserError as e:
        raise HTTPException(
            status_code=400,
            detail=f"The was an error parsing the yaml: {e}",
        )


@schemas.get("/{namespace}/{schema}", response_model=Union[SchemaGetResponse, dict])
async def get_schema(
    namespace: str,
    schema: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    return_type: Optional[Literal["yaml", "json"]] = "json",
):
    try:
        schema_dict = agent.schema.get(namespace=namespace, name=schema)
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Schema {schema}/{namespace} not found."
        )
    if return_type == "yaml":

        info = agent.schema.info(namespace=namespace, name=schema)
        return SchemaGetResponse(
            schema=yaml.dump(schema_dict),
            description=info.description,
            last_update_date=info.last_update_date,
            submission_date=info.submission_date,
        )
    else:
        return schema_dict


@schemas.get("/{namespace}/{schema}/file")
async def download_schema(
    namespace: str,
    schema: str,
    agent: PEPDatabaseAgent = Depends(get_db),
) -> Response:
    try:
        schema_dict = agent.schema.get(namespace=namespace, name=schema)
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Schema {schema}/{namespace} not found."
        )
    return download_yaml(schema_dict, file_name=f"{namespace}/{schema}.yaml")


@schemas.delete("/{namespace}/{schema}")
async def delete_schema(
    namespace: str,
    schema: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403, detail="You do not have permission to delete this schema"
        )

    agent.schema.delete(namespace=namespace, name=schema)
    return {"message": "Schema deleted successfully"}


@schemas.patch("/{namespace}/{schema}")
async def update_schema(
    namespace: str,
    schema: str,
    updated_schema: SchemaUpdateRequest,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403, detail="You do not have permission to update this schema"
        )

    # get current version of the schema
    current_schema = agent.schema.get(namespace=namespace, name=schema)
    current_schema_annotation = agent.schema.info(namespace=namespace, name=schema)

    new_schema = (
        yaml.safe_load(updated_schema.schema)
        if updated_schema.schema
        else current_schema
    )

    try:
        agent.schema.update(
            namespace=namespace,
            name=schema,
            schema=new_schema,
            description=(
                updated_schema.description or current_schema_annotation.description
            ),
        )
    except yaml.parser.ParserError as e:
        raise HTTPException(
            status_code=400,
            detail=f"The was an error parsing the yaml: {e}",
        )
    except yaml.scanner.ScannerError as e:
        raise HTTPException(
            status_code=400,
            detail=f"The was an error scanning the yaml: {e}",
        )

    return {"message": "Schema updated successfully"}


@schemas.post("/{namespace}/{schema}/groups")
async def assign_group_to_schema(
    namespace: str,
    schema: str,
    group: SchemaGroupAssignRequest,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to assign this group to this schema",
        )

    # split the group into namespace and name
    group_namespace, group_name = group.group.split("/")

    # run the assignment
    agent.schema.group_add_schema(
        namespace=group_namespace,
        name=group_name,
        schema_namespace=namespace,
        schema_name=schema,
    )

    return {"message": "Group assigned to schema successfully"}


@schemas.delete("/{namespace}/{schema}/groups")
async def remove_group_from_schema(
    namespace: str,
    schema: str,
    group: SchemaGroupAssignRequest,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to remove this group from this schema",
        )

    # split the group into namespace and name
    group_namespace, group_name = group.group.split("/")

    # run the assignment
    agent.schema.group_remove_schema(
        namespace=namespace,
        name=group_name,
        schema_namespace=group_namespace,
        schema_name=schema,
    )

    return {"message": "Group removed from schema successfully"}


@groups.get("", response_model=SchemaGroupSearchResult)
async def get_all_groups(
    namespace: Optional[str] = None,
    query: Optional[str] = None,
    limit: Optional[int] = 100,
    offset: Optional[int] = 0,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    result = agent.schema.group_search(
        namespace=namespace,
        search_str=query,
        limit=limit,
        offset=offset,
    )
    return result


@groups.get("/{namespace}", response_model=SchemaGroupSearchResult)
async def get_groups_in_namespace(
    namespace: str,
    query: Optional[str] = None,
    limit: Optional[int] = 100,
    offset: Optional[int] = 0,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    result = agent.schema.group_search(
        namespace=namespace, search_str=query, limit=limit, offset=offset
    )
    return result


@groups.get("/{namespace}/{group}", response_model=SchemaGroupAnnotation)
async def get_group(
    namespace: str,
    group: str,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    try:
        res = agent.schema.group_get(namespace=namespace, name=group)
        return res
    except SchemaGroupDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Group {group}/{namespace} not found."
        )


@groups.post("/{namespace}")
async def create_group_for_namespace(
    namespace: str,
    new_group: SchemaGroupCreateRequest,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to create a group in this namespace",
        )

    try:
        agent.schema.group_create(
            namespace=namespace,
            name=new_group.name,
            description=new_group.description,
        )
        return {
            "message": "Group created successfully",
        }

    except SchemaGroupAlreadyExistsError:
        raise HTTPException(
            status_code=409,
            detail=f"Group {new_group.name}/{namespace} already exists.",
        )


@groups.delete("/{namespace}/{group}")
async def delete_group(
    namespace: str,
    group: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403, detail="You do not have permission to delete this group"
        )

    agent.schema.group_delete(namespace=namespace, name=group)
    return {"message": "Group deleted successfully"}
