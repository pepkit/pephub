import os
import json
import jinja2
from typing import Union
from fastapi import APIRouter, Request, Depends, Header
from fastapi.responses import RedirectResponse, Response
from fastapi.exceptions import HTTPException
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import requests

from pephub.dependencies import JWT_SECRET, CLIAuthSystem

from ...helpers import build_authorization_url
from ...dependencies import read_session_info, set_session_info
from ...const import BASE_TEMPLATES_PATH

load_dotenv()

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(BASE_TEMPLATES_PATH))

# Global config
github_app_config = {
    "client_id": os.getenv("GH_CLIENT_ID", "dummy-client-id"),
    "client_secret": os.getenv("GH_CLIENT_SECRET", "dummy-secret"),
    "redirect_uri": os.getenv("REDIRECT_URI"),
}

auth = APIRouter(prefix="/auth", tags=["auth", "users", "login", "authentication"])


@auth.get("/login", response_class=RedirectResponse)
def login(client_redirect_uri: Union[str, None] = None):
    """
    Redirects to log user in to GitHub. GitHub will pass a code to the callback URL.
    """
    state = {
        "client_redirect_uri": client_redirect_uri,
        "secret": JWT_SECRET,
    }
    return build_authorization_url(
        client_id=github_app_config["client_id"],
        redirect_uri=github_app_config["redirect_uri"],
        state=json.dumps(state),
    )


@auth.get("/callback", response_class=RedirectResponse)
def callback(
    response: Response,
    code: Union[str, None] = None,
    state: Union[str, None] = None,
):
    # We should check the provided state here to confirm that we generated it
    state = json.loads(state)
    if state["secret"] != JWT_SECRET:
        raise HTTPException(
            status_code=400,
            detail="The provided state is invalid. Please try logging in again.",
        )
    client_redirect_uri = state["client_redirect_uri"]
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
        u["organizations_url"],
        headers={"Authorization": f"Bearer {x['access_token']}"},
    ).json()

    # encode the token
    token = CLIAuthSystem.jwt_encode_user_data(
        dict(orgs=[org["login"] for org in organizations], **u)
    )

    # return token either to client_redirect,
    # or to a basic login success page.
    # add token as query param
    if client_redirect_uri:
        send_to = client_redirect_uri + f"?token={token}"
    else:
        send_to = f"/auth/login/success?token={token}"
    return send_to


@auth.get("/login/success")
def login_success(request: Request):
    return templates.TemplateResponse(
        "login_success_default.html", {"request": request}
    )


@auth.post("/login_cli")
def login_from_cli(access_token: Union[str, None] = Header(default=None)):
    return {"jwt_token": CLIAuthSystem().get_jwt(access_token)}
