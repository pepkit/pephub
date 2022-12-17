from typing import Optional
from pepdbagent.models import ProjectModel

class Project(ProjectModel):
    pass

class ProjectOptional(Project):
    __annotations__ = {k: Optional[v] for k, v in Project.__annotations__.items()}