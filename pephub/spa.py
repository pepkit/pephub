from pathlib import Path
from fastapi import Request
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from starlette.types import ASGIApp, Receive, Scope, Send

from .const import SPA_PATH

class SPA(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Send) -> Response:
        # make sure the api doesnt get redirected
        response = await call_next(request)
        
        # If the response is a 404 and the path doesn't start with `/api`, serve the index.html file
        if response.status_code == 404 and not request.url.path.startswith("/api"):
            index_file_path = Path(f"{SPA_PATH}/index.html")
            return FileResponse(index_file_path)
        
        return response