from typing import Optional

import yaml
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException

from pepdbagent import PEPDatabaseAgent
from pepdbagent.exceptions import SchemaDoesNotExistError, SchemaAlreadyExistsError

from ...models import SchemaCreateRequest, SchemaUpdateRequest
from ....dependencies import (
    get_db,
    get_namespace_access_list,
    get_user_from_session_info,
)

load_dotenv()

schemas = APIRouter(prefix="/api/v1/schemas", tags=["schemas"])


@schemas.get("")
async def get_all_schemas(
    query: Optional[str] = None,
    limit: Optional[int] = 100,
    offset: Optional[int] = 0,
    namespace: Optional[str] = None,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    result = agent.schema.search(
        namespace=namespace,
        search_str=query,
        limit=limit,
        offset=offset,
    )
    return result


@schemas.get("/{namespace}")
async def get_schemas_in_namespace(
    namespace: str,
    limit: Optional[int] = 100,
    offset: Optional[int] = 0,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    result = agent.schema.search(namespace=namespace, limit=limit, offset=offset)
    return result


@schemas.post("/{namespace}")
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
    schema_str = new_schema.schema
    schema_dict = yaml.safe_load(schema_str)

    try:
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


@schemas.get("/{namespace}/{schema}")
async def get_schema(
    namespace: str,
    schema: str,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    try:
        res = agent.schema.get(namespace=namespace, name=schema)
        return {"schema": yaml.dump(res)}
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Schema {schema}/{namespace} not found."
        )


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

    agent.schema.update(
        namespace=namespace,
        name=schema,
        schema=yaml.safe_load(updated_schema.schema),
        description=updated_schema.description,
    )

    return {"message": "Schema updated successfully"}
