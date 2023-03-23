from typing import Optional
from pydantic import BaseModel
from pepdbagent.models import *


class ProjectOptional(UpdateItems):
    sample_table_csv: Optional[str]
    project_config_yaml: Optional[str]
    description: Optional[str]

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
    config: dict
    subsample_dict: Optional[dict] = None
    name: str
    sample_dict: dict

    class Config:
        extra = Extra.allow
