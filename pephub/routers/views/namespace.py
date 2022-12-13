import jinja2
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from starlette.templating import Jinja2Templates
from peppy import __version__ as peppy_version
from platform import python_version
from dotenv import load_dotenv

from ..._version import __version__ as pephub_version
from ...dependencies import *
from ...const import BASE_TEMPLATES_PATH


load_dotenv()

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(BASE_TEMPLATES_PATH))

ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peppy_version": peppy_version,
    "python_version": python_version(),
    "api_version": 1
}

namespace = APIRouter(
    prefix="/{namespace}",
    tags=["views", "user interface", "interface"]
)

@namespace.get(
    "/",
    summary="View a visual summary of a particular namespace.",
    response_class=HTMLResponse,
)
async def namespace_view(
    request: Request,
    namespace: str,
    db: Connection = Depends(get_db),
    user=Depends(get_user_from_session_info),
    session_info=Depends(read_session_info),
    organizations=Depends(get_organizations_from_session_info),
):
    """Returns HTML response with a visual summary of the namespace."""
    nspace = db.get_namespace_info(namespace, user)
    return templates.TemplateResponse(
        "namespace.html",
        {
            "namespace": nspace,
            "request": request,
            "peppy_version": peppy_version,
            "python_version": python_version(),
            "pephub_version": pephub_version,
            "logged_in": user is not None,
            "session_info": session_info
        },
    )