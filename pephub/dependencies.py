from fastapi import HTTPException
import peppy
import os

from .main import _PEP_STORES

from .route_examples import example_namespace


# verify namespace
def verify_namespace(namespace: str = example_namespace) -> None:
    if _PEP_STORES.get_namespace(namespace.lower()) is None:
        raise HTTPException(
            status_code=404, detail=f"namespace '{namespace}' not found."
        )


# verify project id
def verify_project(namespace: str, pep_id: str) -> None:
    namespace = namespace.lower()
    pep_id = pep_id.lower()
    if _PEP_STORES.get_project(namespace, pep_id) is None:
        raise HTTPException(
            status_code=404,
            detail=f"pep_id '{pep_id}' not found in namespace {namespace}",
        )


# valdiate the PEP
def validate_pep(namespace: str, pep_id: str):
    namespace = namespace.lower()
    pep_id = pep_id.lower()
    proj = _PEP_STORES.get_project(namespace, pep_id)
    config_path = proj['cfg']
    if not os.path.exists(config_path):
        raise HTTPException(
            status_code=404,
            detail=f"Configuration file '{config_path}' was not found. Ensure \
                    that you have included it in your pep directory and that \
                    your .pep.yaml file is correct",
        )
    try:
        yield peppy.Project(config_path)
    except NotImplementedError as nie:
        raise HTTPException(status_code=400, detail=f"Error loading PEP. {nie}")
