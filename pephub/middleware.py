import os
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

        # If the response is a 404 and the path doesn't start with `/api` or `/auth`,
        # serve the index.html file
        if (
            response.status_code == 404
            and not request.url.path.startswith("/api")
            and not request.url.path.startswith("/auth")
        ):
            index_file_path = Path(f"{SPA_PATH}/index.html")
            return FileResponse(index_file_path)

        return response


class EnvironmentMiddleware(BaseHTTPMiddleware):
    """
    This middleware will temporarily set any environment variables
    pass in when a request is recieved with the `env` query parameter.

    These can be semi-colon separated key-value pairs or a JSON object.
    """

    async def dispatch(self, request: Request, call_next: Send) -> Response:
        # set the environment variables
        env = request.query_params.get("env")
        if env:
            self.env = {}
            if env.startswith("{"):
                import json

                self.env = json.loads(env)
            else:
                for pair in env.split(";"):
                    key, value = pair.split("=")
                    self.env[key] = value

            for key, value in self.env.items():
                os.environ[key] = value

        response = await call_next(request)

        # remove the environment variables
        for key in self.env.keys():
            del os.environ[key]

        return response
