# this file is for API documentation route examples.

from fastapi import Path, Query
from pydantic import BaseModel

# example for /pep/{namespace}
example_namespace = Path(
    ..., description="A namespace that holds projects.", regex=r"^\w+$", example="demo"
)

example_project = Path(
    ...,
    description="A project name inside a particular namespace",
    example="BiocProject",
)

# example for /pep/{namespace}/{pep}/convert
example_filter = Query(
    ...,
    description="A valid eido conversion filter type. See /eido/filters for a list of valid filters.",
    example="basic",
)


class ValidationRequest(BaseModel):
    namespace: str
    project: str
