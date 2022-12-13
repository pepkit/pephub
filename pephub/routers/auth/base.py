import os
from typing import Union
from fastapi import APIRouter, Request, Depends, Header
from fastapi.responses import RedirectResponse, Response
from peppy import __version__ as peppy_version
from platform import python_version
from dotenv import load_dotenv
import requests

from pephub.dependencies import JWT_SECRET, CLIAuthSystem

from ...helpers import build_authorization_url
from ..._version import __version__ as pephub_version
from ...dependencies import read_session_info, set_session_info

load_dotenv()

# Global config
github_app_config = {
    "client_id": os.getenv("GH_CLIENT_ID", "dummy-client-id"),
    "client_secret": os.getenv("GH_CLIENT_SECRET", "dummy-secret"),
    "redirect_uri": os.getenv("REDIRECT_URI"),
}

ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peppy_version": peppy_version,
    "python_version": python_version()
}

auth = APIRouter(
    prefix="/auth", 
    tags=["auth", "users", "login", "authentication"]
)

@auth.get("/login", response_class=RedirectResponse)
def login(request: Request):
    """
    Redirects to log user in to GitHub. GitHub will pass a code to the callback URL.
    """
    return build_authorization_url(
        github_app_config["client_id"],
        github_app_config["redirect_uri"],
        JWT_SECRET,
        **request.query_params,
    )

@auth.get("/callback", response_class=RedirectResponse)
def callback(
    response: Response,
    request: Request,
    code: Union[str, None] = None,
    state: Union[str, None] = None,
):
    # TODO: We should check the provided state here to confirm that we generated it

    # Make a request to the following endpoint to receive an access token
    url = "https://github.com/login/oauth/access_token"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",  # specify we want json back, or else it gives a param string
    }
    github_acc_request_data = {
        "client_id": github_app_config["client_id"],
        "client_secret": github_app_config["client_secret"],
        "redirect_uri": github_app_config["redirect_uri"],
        "code": code,
        "state": state,
    }
    x = requests.post(url, data=github_acc_request_data, headers=headers).json()
    # This contains the access token

    # Use the access token to get the username and organization memberships,
    # which is all we need for this app.
    # In a more complicated app, we could store the access token itself,
    # encrypted in the session info, so we could continue to query GitHub
    # on behalf of the logged in user. For PEPhub, all we really need is
    # the username and available organizations.
    u = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"Bearer {x['access_token']}"},
    ).json()

    organizations = requests.get(
        f"https://api.github.com/users/{u['login']}/orgs",
        headers={"Authorization": f"Bearer {x['access_token']}"},
    ).json()

    set_session_info(
        response,
        dict(
            orgs = [org["login"] for org in organizations],
            **u
        ),
    )
    return "/profile"

@auth.get("/profile")
async def view_profile(session_info: dict = Depends(read_session_info)):
    if session_info:
        return session_info
    else:
        return {"message": "Unauthorized user"}


@auth.get("/logout")
def logout(response: RedirectResponse):
    response = RedirectResponse(url="/")
    response.delete_cookie("pephub_session")
    return response


@auth.post("/login_cli")
def login_from_cli(access_token: Union[str, None] = Header(default=None)):
    return {"jwt_token": CLIAuthSystem().get_jwt(access_token)}