from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends

from pepdbagent import PEPDatabaseAgent

from ....dependencies import (
    get_db,
    get_namespace_access_list,
    get_user_from_session_info,
)

load_dotenv()

schemas = APIRouter(prefix="/api/v1/schemas", tags=["schemas"])


@schemas.get("/")
async def get_all_schemas(
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    pass


@schemas.get("/{namespace}")
async def get_schemas_in_namespace(
    namespace: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    pass


@schemas.post("/{namespace}")
async def create_schema_for_namespace(
    namespace: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    pass


@schemas.get("/{namespace}/{schema}")
async def get_schema(
    namespace: str,
    schema: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    pass


@schemas.delete("/{namespace}/{schema}")
async def delete_schema(
    namespace: str,
    schema: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    pass


@schemas.patch("/{namespace}/{schema}")
async def update_schema(
    namespace: str,
    schema: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    pass
