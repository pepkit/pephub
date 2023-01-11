from typing import Optional
from pydantic import BaseModel
import pydantic
from pydantic import Extra
from pepdbagent.models import UpdateItems


class ProjectOptional(UpdateItems):
    sample_table_csv: Optional[str]
    project_config_yaml: Optional[str]
    description: Optional[str]

    class Config:
        allow_population_by_field_name = True


class SearchQuery(BaseModel):
    query: str
    collection_name: Optional[str] = None
