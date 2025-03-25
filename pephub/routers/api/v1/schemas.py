from typing import Optional, Union, Literal, List, Dict
from starlette.responses import Response

import yaml
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from fastapi.responses import JSONResponse, PlainTextResponse

from pepdbagent import PEPDatabaseAgent
from pepdbagent.exceptions import (
    SchemaDoesNotExistError,
    SchemaAlreadyExistsError,
    SchemaVersionDoesNotExistError,
    SchemaVersionAlreadyExistsError,
    SchemaTagDoesNotExistError,
)
import yaml.parser
import yaml.scanner

from pepdbagent.models import (
    SchemaSearchResult,
    SchemaRecordAnnotation,
    SchemaVersionSearchResult,
    UpdateSchemaRecordFields,
    UpdateSchemaVersionFields,
)

from ...models import (
    NewSchemaRecordModel,
    NewSchemaVersionModel,
    SchemaVersionTagAddModel,
)

from ....helpers import download_yaml, download_json
from ....dependencies import (
    get_db,
    get_namespace_access_list,
    get_user_from_session_info,
)

import json

load_dotenv()

groups = APIRouter(prefix="/api/v1/schema-groups", tags=["groups"])
schemas = APIRouter(prefix="/api/v1/schemas", tags=["schemas"])


@schemas.get("", response_model=SchemaSearchResult)
async def get_all_schemas(
    query: Optional[str] = None,
    page: Optional[int] = 0,
    page_size: Optional[int] = 100,
    order_by: Literal["name", "update_date"] = "update_date",
    order_desc: bool = False,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Search all schemas throughout the database. Search is performed on schema name, and description.
    """

    result = agent.schema.query_schemas(
        namespace=None,
        search_str=query,
        page=page,
        page_size=page_size,
        order_by=order_by,
        order_desc=order_desc,
    )
    return result


@schemas.get("/{namespace}", response_model=SchemaSearchResult)
async def get_schemas_in_namespace(
    namespace: str,
    name: Optional[str] = None,
    maintainer: Optional[str] = None,
    lifecycle_stage: Optional[str] = None,
    latest_version: Optional[str] = None,
    page: Optional[int] = 0,
    page_size: Optional[int] = 100,
    agent: PEPDatabaseAgent = Depends(get_db),
    order_by: Literal["name", "update_date"] = "update_date",
    order_desc: bool = False,
):
    """
    Get schemas for specific endpoint, by providing query parameters to filter the results.

    ## NOTE: latest_version is not implemented yet.
    """

    result = agent.schema.fetch_schemas(
        namespace=namespace,
        name=name,
        maintainer=maintainer,
        lifecycle_stage=lifecycle_stage,
        # latest_version=latest_version,
        page_size=page_size,
        page=page,
        order_by=order_by,
        order_desc=order_desc,
    )
    return result


@schemas.post("/{namespace}/files")
async def create_schema_for_namespace_by_file(
    namespace: str,
    schema_name: str = Form(...),
    version: str = Form(...),
    description: str = Form(None),
    maintainers: str = Form(None),
    lifecycle_stage: str = Form(None),
    contributors: str = Form(None),
    release_notes: str = Form(None),
    tags: Optional[Union[List[str], str, Dict[str, str], List[Dict[str, str]]]] = Form(
        None
    ),
    schema_file: UploadFile = File(...),
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    """
    Create a new schema record with first schema version from a file
    """

    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403, detail="You do not have permission to create this schema"
        )

    # Check if tags is a string that needs to be parsed
    if isinstance(tags, str) and tags.startswith("{") and tags.endswith("}"):
        try:
            tags = json.loads(tags)  # Parse the JSON string into a dictionary
        except json.JSONDecodeError:
            pass  # Keep original value if parsing fails

    # parse out the schema into a dictionary
    try:
        schema_str = schema_file.file.read().decode("utf-8")
        schema_dict = yaml.safe_load(schema_str)

        agent.schema.create(
            namespace=namespace,
            name=schema_name,
            version=version,
            schema_value=schema_dict,
            description=description,
            lifecycle_stage=lifecycle_stage,
            maintainers=maintainers,
            contributors=contributors,
            release_notes=release_notes,
            tags=tags,
        )

        return {
            "message": "Schema created successfully",
        }

    except SchemaAlreadyExistsError:
        raise HTTPException(
            status_code=409,
            detail=f"Schema {namespace}/{schema_name} already exists.",
        )
    except yaml.parser.ParserError as e:
        raise HTTPException(
            status_code=400,
            detail=f"The was an error parsing the yaml: {e}",
        )


@schemas.post("/{namespace}/json")
async def create_schema_for_namespace_by_file(
    namespace: str,
    schema_data: NewSchemaRecordModel,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    """
    Create a new schema record with first schema version from a json object
    """

    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403, detail="You do not have permission to create this schema"
        )

    # parse out the schema into a dictionary
    try:

        agent.schema.create(
            namespace=namespace,
            name=schema_data.schema_name,
            version=schema_data.version,
            schema_value=schema_data.schema_value,
            description=schema_data.description,
            lifecycle_stage=schema_data.lifecycle_stage,
            maintainers=schema_data.maintainers,
            contributors=schema_data.contributors,
            release_notes=schema_data.release_notes,
            tags=schema_data.tags,
        )

        return {
            "message": "Schema created successfully",
        }

    except SchemaAlreadyExistsError:
        raise HTTPException(
            status_code=409,
            detail=f"Schema {namespace}/{schema_data.schema_name} already exists.",
        )
    except yaml.parser.ParserError as e:
        raise HTTPException(
            status_code=400,
            detail=f"The was an error parsing the yaml: {e}",
        )


@schemas.get("/{namespace}/{schema_name}", response_model=SchemaRecordAnnotation)
async def get_schema(
    namespace: str, schema_name: str, agent: PEPDatabaseAgent = Depends(get_db)
):
    """
    Get a schema record information
    """

    try:
        schema_info = agent.schema.get_schema_info(
            namespace=namespace, name=schema_name
        )
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Schema {namespace}/{schema_name} not found"
        )
    return schema_info


@schemas.patch("/{namespace}/{schema_name}")
def update_schema_info(
    namespace: str,
    schema_name: str,
    update_fields: UpdateSchemaRecordFields,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    """
    Update a schema record
    """

    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403, detail="You do not have permission to update this schema"
        )

    try:
        agent.schema.update_schema_record(
            namespace=namespace,
            name=schema_name,
            update_fields=update_fields,
        )
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Schema {namespace}/{schema_name} not found."
        )

    return JSONResponse({"message": "Schema updated successfully"})


@schemas.delete("/{namespace}/{schema_name}")
async def delete_schema(
    namespace: str,
    schema: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    """
    Delete a schema record
    """

    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403, detail="You do not have permission to delete this schema"
        )
    try:
        agent.schema.delete_schema(namespace=namespace, name=schema)
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Schema {namespace}/{schema} not found."
        )
    return {"message": "Schema deleted successfully"}


@schemas.get(
    "/{namespace}/{schema_name}/versions", response_model=SchemaVersionSearchResult
)
async def get_schema(
    namespace: str,
    schema_name: str,
    query: Optional[str] = "",
    tag: Optional[str] = None,
    page: Optional[int] = 0,
    page_size: Optional[int] = 100,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Get all versions of a schema object
    """

    try:
        schema_info = agent.schema.query_schema_version(
            search_str=query,
            namespace=namespace,
            name=schema_name,
            tag=tag,
            page=page,
            page_size=page_size,
        )
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Schema {namespace}/{schema_name} not found"
        )
    return schema_info


@schemas.get(
    "/{namespace}/{schema_name}/versions/{semantic_version}",
    response_model=Union[dict, str],
)
async def get_schema_versions(
    namespace: str,
    schema_name: str,
    semantic_version: str,
    format: Literal["json", "yaml"] = "json",
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Get a specific version of a schema object in json or yaml format
    """

    try:
        schema_dict = agent.schema.get(
            namespace=namespace, name=schema_name, version=semantic_version
        )
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404,
            detail=f"Schema {namespace}/{schema_name}:{semantic_version} not found.",
        )
    except SchemaVersionDoesNotExistError:
        raise HTTPException(
            status_code=404,
            detail=f"Schema version {semantic_version} not found for {namespace}/{schema_name}.",
        )
    if format == "yaml":
        return PlainTextResponse(str(yaml.dump(schema_dict)))

    return JSONResponse(content=schema_dict)


@schemas.get("/{namespace}/{schema_name}/versions/{semantic_version}/file")
async def download_schema(
    namespace: str,
    schema_name: str,
    semantic_version: str,
    format: Literal["json", "yaml"] = "yaml",
    agent: PEPDatabaseAgent = Depends(get_db),
) -> Response:
    """
    Download specific version of schema object as a yaml file
    """

    try:
        schema_dict = agent.schema.get(
            namespace=namespace, name=schema_name, version=semantic_version
        )
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Schema {namespace}/{schema_name} not found."
        )
    if format == "json":
        return download_json(schema_dict, file_name=f"{namespace}/{schema_name}.json")
    return download_yaml(schema_dict, file_name=f"{namespace}/{schema_name}.yaml")


@schemas.post("/{namespace}/{schema_name}/versions/files")
async def create_schema_version(
    namespace: str,
    schema_name: str,
    version: str = Form(...),
    contributors: str = Form(None),
    release_notes: str = Form(None),
    tags: Optional[Union[List[str], str, Dict[str, str], List[Dict[str, str]]]] = Form(
        None
    ),
    schema_file: UploadFile = File(...),
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    """
    Create a new version of a schema record from a file
    """

    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to create this schema version",
        )

    schema_str = schema_file.file.read().decode("utf-8")
    schema_dict = yaml.safe_load(schema_str)
    schema_name = schema_name or schema_file.filename

    try:
        agent.schema.add_version(
            namespace=namespace,
            name=schema_name,
            version=version,
            schema_value=schema_dict,
            contributors=contributors,
            release_notes=release_notes,
            tags=tags,
        )
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Schema {namespace}/{schema_name} not found."
        )
    except SchemaVersionAlreadyExistsError:
        raise HTTPException(
            status_code=409,
            detail=f"Schema version {version} already exists for {schema_name}/{namespace}:{version}.",
        )
    return JSONResponse({"message": "Schema version created successfully"})


@schemas.post("/{namespace}/{schema_name}/versions/json")
async def create_schema_version(
    namespace: str,
    schema_name: str,
    schema_data: NewSchemaVersionModel,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    """
    Create a new version of a schema record from a json object
    """

    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to create this schema version",
        )

    try:
        agent.schema.add_version(
            namespace=namespace,
            name=schema_name,
            version=schema_data.version,
            schema_value=schema_data.schema_value,
            contributors=schema_data.contributors,
            release_notes=schema_data.release_notes,
            tags=schema_data.tags,
        )
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Schema {namespace}/{schema_name} not found."
        )
    except SchemaVersionAlreadyExistsError:
        raise HTTPException(
            status_code=409,
            detail=f"Schema version {schema_data.version} already exists for {namespace}/{schema_name}:{schema_data.version}.",
        )
    return JSONResponse({"message": "Schema version created successfully"})


@schemas.patch("/{namespace}/{schema_name}/versions/{semantic_version}")
def update_schema_version(
    namespace: str,
    schema_name: str,
    semantic_version: str,
    update_fields: UpdateSchemaVersionFields,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    """
    Update a schema version
    """

    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update this schema version",
        )

    try:
        agent.schema.update_schema_version(
            namespace=namespace,
            name=schema_name,
            version=semantic_version,
            update_fields=update_fields,
        )
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Schema {namespace}/{schema_name} not found."
        )
    except SchemaVersionDoesNotExistError:
        raise HTTPException(
            status_code=404,
            detail=f"Schema version {semantic_version} not found for {namespace}/{schema_name}.",
        )

    return JSONResponse({"message": "Schema version updated successfully"})


@schemas.delete("/{namespace}/{schema_name}/versions/{semantic_version}")
async def delete_schema_version(
    namespace: str,
    schema_name: str,
    semantic_version: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    """
    Delete a schema version
    """

    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to delete this schema version",
        )
    try:
        agent.schema.delete_version(
            namespace=namespace, name=schema_name, version=semantic_version
        )
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Schema {namespace}/{schema_name} not found."
        )
    except SchemaVersionDoesNotExistError:
        raise HTTPException(
            status_code=404,
            detail=f"Schema version {semantic_version} not found for {namespace}/{schema_name}.",
        )
    return {"message": "Schema version deleted successfully"}


@schemas.post("/{namespace}/{schema_name}/versions/{semantic_version}/tags")
def add_tags_to_schema_version(
    namespace: str,
    schema_name: str,
    semantic_version: str,
    tag: SchemaVersionTagAddModel,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    """
    Add a new tag to a schema version
    """

    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to add this tag to schema version",
        )
    try:
        agent.schema.add_tag_to_schema(
            namespace=namespace, name=schema_name, version=semantic_version, tag=tag.tag
        )
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Schema {namespace}/{schema_name} not found."
        )
    except SchemaVersionDoesNotExistError:
        raise HTTPException(
            status_code=404,
            detail=f"Schema version {semantic_version} not found for {namespace}/{schema_name}.",
        )
    return {"message": "Tag added to schema version successfully"}


# remove tags from version
@schemas.delete("/{namespace}/{schema_name}/versions/{semantic_version}/tags")
def remove_tags_from_schema_version(
    namespace: str,
    schema_name: str,
    semantic_version: str,
    tag: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    """
    Remove a tag from a schema version
    """

    if user_name not in list_of_admins:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to remove this tag from schema version",
        )
    try:
        agent.schema.remove_tag_from_schema(
            namespace=namespace, name=schema_name, version=semantic_version, tag=tag
        )
    except SchemaDoesNotExistError:
        raise HTTPException(
            status_code=404, detail=f"Schema {namespace}/{schema_name}:{tag} not found."
        )
    except SchemaVersionDoesNotExistError:
        raise HTTPException(
            status_code=404,
            detail=f"Schema version {semantic_version} not found for {namespace}/{schema_name}.",
        )
    except SchemaTagDoesNotExistError:
        raise HTTPException(
            status_code=404,
            detail=f"Tag {tag} not found for {namespace}/{schema_name}:{tag}.",
        )
    return {"message": "Tag removed from schema version successfully"}
