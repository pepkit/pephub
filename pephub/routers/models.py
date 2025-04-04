from typing import List, Optional, Dict, Union

from pepdbagent.const import DEFAULT_TAG
from pepdbagent.models import UpdateItems, ListOfNamespaceInfo
from pydantic import BaseModel, ConfigDict, Field

from ..const import DEFAULT_QDRANT_SCORE_THRESHOLD


class ProjectOptional(UpdateItems):
    # sample table is a list of JSON objects
    sample_table: Optional[List[dict]] = None
    project_config_yaml: Optional[str] = None
    subsample_tables: Optional[List[List[dict]]] = None

    model_config = ConfigDict(populate_by_name=True)


class SearchQuery(BaseModel):
    query: str
    collection_name: Optional[str] = None
    limit: Optional[int] = 100
    offset: Optional[int] = 0
    score_threshold: Optional[float] = DEFAULT_QDRANT_SCORE_THRESHOLD


class RawValidationQuery(BaseModel):
    project_config: str
    sample_table: Optional[str] = None


class TokenExchange(BaseModel):
    code: str
    client_redirect_uri: Optional[str] = None


class ForkRequest(BaseModel):
    fork_to: str
    fork_name: str
    fork_tag: Optional[str] = None
    fork_description: Optional[str] = None


class FavoriteRequest(BaseModel):
    namespace: str
    name: str
    tag: Optional[str] = DEFAULT_TAG


class InitializeDeviceCodeResponse(BaseModel):
    device_code: str
    auth_url: str


class GitHubAppConfig(BaseModel):
    client_id: str
    client_secret: str
    base_uri: str
    redirect_uri: str


class JWTDeviceTokenResponse(BaseModel):
    jwt_token: str


class ProjectRawModel(BaseModel):
    config: dict = Field(alias="_config")
    subsample_list: Optional[list] = Field(alias="_subsample_list", default=None)
    sample_list: list[dict] = Field(alias="_sample_dict")

    model_config = ConfigDict(populate_by_name=True)


class ProjectHistoryResponse(BaseModel):
    config: str = Field(alias="_config")
    subsample_list: Optional[list] = Field(alias="_subsample_list", default=None)
    sample_list: list[dict] = Field(alias="_sample_dict")

    model_config = ConfigDict(populate_by_name=True)


class ProjectRawRequest(BaseModel):
    config: dict
    subsample_list: Optional[List[List[dict]]] = None
    sample_list: List[dict]

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class ProjectJsonRequest(BaseModel):
    pep_dict: ProjectRawRequest
    name: Optional[str] = None
    description: Optional[str] = None
    is_private: bool = False
    tag: str = DEFAULT_TAG
    overwrite: bool = False
    pep_schema: Optional[str] = None
    pop: Optional[bool] = None


class RevokeRequest(BaseModel):
    last_five_chars: str


class DeveloperKey(BaseModel):
    key: str
    created_at: str
    expires: str


class VersionResponseModel(BaseModel):
    pephub_version: str
    peppy_version: str
    python_version: str
    fastapi_version: str
    pepdbagent_version: str
    api_version: int


class BaseEndpointResponseModel(VersionResponseModel):
    message: str


class SamplesResponseModel(BaseModel):
    count: int
    items: list


class ConfigResponseModel(BaseModel):
    config: str


class SchemaCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    schema: str


class SchemaUpdateRequest(BaseModel):
    description: Optional[str] = None
    schema: Optional[str] = None


class SchemaGroupCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None


class SchemaGroupUpdateRequest(BaseModel):
    description: Optional[str] = None


class SchemaGroupAssignRequest(BaseModel):
    group: str


class SchemaGetResponse(BaseModel):
    schema: str
    description: Optional[str] = None
    last_update_date: str = ""
    submission_date: str = ""


class StandardizerResponse(BaseModel):
    results: dict = {}


# Schemas:
class NewSchemaVersionModel(BaseModel):
    """
    Model for creating a new schema version from json
    """

    contributors: str = None
    release_notes: str = None
    tags: Optional[Union[List[str], str, Dict[str, str], List[Dict[str, str]]]] = (
        None,
    )
    version: str
    schema_value: dict


class NewSchemaRecordModel(NewSchemaVersionModel):
    """
    Model for creating a new schema record from json
    """

    schema_name: str
    description: str = None
    maintainers: str = None
    lifecycle_stage: str = None
    private: bool = False


class SchemaVersionTagAddModel(BaseModel):
    """
    Model for adding a tag to a schema version
    """

    tag: Optional[Union[List[str], str, Dict[str, str], List[Dict[str, str]]]] = None


class NamespaceInfoReturnModel(ListOfNamespaceInfo):
    server: str
