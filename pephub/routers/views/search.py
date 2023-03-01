from fastapi import APIRouter, Depends, Request
from fastapi.templating import Jinja2Templates

from ...dependencies import read_session_info
from ...const import BASE_TEMPLATES_PATH, DEFAULT_QDRANT_COLLECTION_NAME

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)

search = APIRouter(tags=["search", "user interface", "interface"])


@search.get("/search")
async def search_view(
    request: Request,
    query: str = "",
    collection_name: str = DEFAULT_QDRANT_COLLECTION_NAME,
    limit: int = 25,
    offset: int = 0,
    score_threshold: float = 0.4,
    session_info=Depends(read_session_info),
):
    return templates.TemplateResponse(
        "search.html",
        {
            "request": request,
            "query": query,
            "collection_name": collection_name,
            "session_info": session_info,
            "logged_in": session_info is not None,
            "limit": limit,
            "offset": offset,
            "score_threshold": score_threshold,
        },
    )
