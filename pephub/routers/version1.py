from fastapi import APIRouter
import peppy

# fetch peps
from ..db import download_peps, load_data_tree
download_peps()
PEP_STORES = load_data_tree()

router = APIRouter(
    prefix="/v1"
)

@router.get("/")
async def root():
    return {
        "message": "welcome to the pepserver"
    }

@router.get("/all")
async def return_all_peps():
    return PEP_STORES

@router.get("/{namespace}")
async def get_namespace(namespace: str):
    if namespace not in PEP_STORES:
        return {
            "message": f"Namespace '{namespace}'' not found."
        }
    else:
        return PEP_STORES[namespace]

@router.get("/{namespace}/{pep_id}")
async def get_pep(namespace: str, pep_id: str):

    # validate namespace
    if namespace not in PEP_STORES:
        return {
            "message": f"Namespace '{namespace}'' not found."
        }

    # validate pep_id
    if pep_id not in PEP_STORES[namespace]:
        return {
            "message": f"PEP '{pep_id}'' not found."
        }
    
    # validate pep
    try:
        proj = peppy.Project(PEP_STORES[namespace][pep_id])
    except NotImplementedError as nie:
        return {
            "status": "error",
            "message": "This PEP does not conform to the PEP 2.0 standards. You can read about those here: http://pep.databio.org/en/latest/specification/#sample-modifier-imply"
        }

    return {
        "pep": proj
    }

    

    
