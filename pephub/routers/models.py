from typing import Optional, List
from pydantic import BaseModel
from pepdbagent.models import *
from pepdbagent.const import DEFAULT_TAG

from ..const import DEFAULT_PEP_SCHEMA


class ProjectOptional(UpdateItems):
    # sample table is a list of JSON objects
    sample_table: Optional[List[dict]]
    project_config_yaml: Optional[str]
    description: Optional[str]
    subsample_list: Optional[List[str]]

    class Config:
        allow_population_by_field_name = True


class SearchQuery(BaseModel):
    query: str
    collection_name: Optional[str] = None
    limit: Optional[int] = 100
    offset: Optional[int] = 0
    score_threshold: Optional[float] = 0.3


class RawValidationQuery(BaseModel):
    project_config: str
    sample_table: Optional[str]


class TokenExchange(BaseModel):
    code: str
    client_redirect_uri: Optional[str] = None


class ForkRequest(BaseModel):
    fork_to: str
    fork_name: str
    fork_tag: Optional[str] = None
    fork_description: Optional[str] = None


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
    description: Optional[str] = ""
    config: dict = Field(alias="_config")
    subsample_dict: Optional[list] = Field(alias="_subsample_dict")
    name: str
    sample_dict: dict = Field(alias="_sample_dict")

    class Config:
        allow_population_by_field_name = True


class ProjectRawRequest(BaseModel):
    description: Optional[str] = ""
    config: dict
    subsample_dict: Optional[list]
    name: str
    sample_dict: List[dict]

    class Config:
        allow_population_by_field_name = True
        extra = Extra.allow


class ProjectJsonRequest(BaseModel):
    pep_dict: ProjectRawRequest
    is_private: bool = False
    tag: str = DEFAULT_TAG
    overwrite: bool = False
    pep_schema: Optional[str] = DEFAULT_PEP_SCHEMA
