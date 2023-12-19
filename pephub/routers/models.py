from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from pepdbagent.models import UpdateItems
from pepdbagent.const import DEFAULT_TAG

from ..const import DEFAULT_PEP_SCHEMA, DEFAULT_QDRANT_SCORE_THRESHOLD


class ProjectOptional(UpdateItems):
    # sample table is a list of JSON objects
    sample_table: Optional[List[dict]] = None
    project_config_yaml: Optional[str] = None
    description: Optional[str] = None
    subsample_tables: Optional[List[List[dict]]] = None
    pop: Optional[bool] = None

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
    pep_schema: Optional[str] = DEFAULT_PEP_SCHEMA
    pop: Optional[bool] = None
