from typing import Optional
from pydantic import BaseModel
from pepdbagent.models import ProjectModel


class Project(ProjectModel):
    pass


class ProjectOptional(Project):
    __annotations__ = {k: Optional[v] for k, v in Project.__annotations__.items()}


class SearchQuery(BaseModel):
    query: str
    collection_name: Optional[str] = None
