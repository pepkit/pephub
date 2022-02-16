from fastapi import HTTPException
import peppy
import os

from .main import _PEP_STORES

# verify namespace
def verify_namespace(namespace: str) -> None:
    if namespace.lower() not in _PEP_STORES:
        raise HTTPException(status_code=404, detail=f"namespace '{namespace}' not found.")

# verify project id
def verify_project(namespace: str, pep_id: str) -> None:
    namespace = namespace.lower()
    pep_id = pep_id.lower()
    if pep_id not in _PEP_STORES[namespace]:
        raise HTTPException(status_code=404, detail=f"pep_id '{pep_id}' not found in namespace {namespace}")
        
# valdiate the PEP
def validate_pep(namespace: str, pep_id: str):
    namespace = namespace.lower()
    pep_id = pep_id.lower()
    config_path = _PEP_STORES[namespace][pep_id]
    if not os.path.exists(config_path):
        raise HTTPException(
            status_code=404, 
            detail=f"Configuration file '{config_path}' was not found. Ensure \
                    that you have included it in your pep directory and that \
                    your .pephub.yaml file is correct"
        )
    try:
        yield peppy.Project(config_path)
    except NotImplementedError as nie:
        raise HTTPException(status_code=400, detail=f"Error loading PEP. {nie}")