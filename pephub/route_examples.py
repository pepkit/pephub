from fastapi import Path

# example for /pep/{namespace}
example_namespace = Path(
    ...,
    description="A pep namespace.",
    example="demo",
)

example_pep_id = Path(
    ...,
    description="A project name inside a particular namespace",
    example="BiocProject"
)