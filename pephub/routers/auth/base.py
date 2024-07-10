import json
import os
import time
from typing import Union

import jinja2
import requests
from dotenv import load_dotenv
from fastapi import APIRouter, BackgroundTasks, Depends, Header, Request
from fastapi.exceptions import HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from ...limiter import limiter

from ...const import (
    AUTH_CODE_EXPIRATION,
    BASE_TEMPLATES_PATH,
    CALLBACK_ENDPOINT,
    JWT_SECRET,
)
from ...dependencies import (
    CLIAuthSystem,
    generate_random_auth_code,
    generate_random_device_code,
    read_authorization_header,
)
from ...helpers import build_authorization_url
from ..models import (
    GitHubAppConfig,
    InitializeDeviceCodeResponse,
    JWTDeviceTokenResponse,
    TokenExchange,
    RevokeRequest,
)
from ...developer_keys import dev_key_handler

load_dotenv()

CODE_EXCHANGE = {}
DEVICE_CODES = {}

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(BASE_TEMPLATES_PATH))

# Global config
github_app_config = GitHubAppConfig(
    client_id=os.getenv("GH_CLIENT_ID", "dummy-client-id"),
    client_secret=os.getenv("GH_CLIENT_SECRET", "dummy-secret"),
    redirect_uri=f"{os.getenv('BASE_URI')}{CALLBACK_ENDPOINT}",
    base_uri=os.getenv("BASE_URI"),
)

auth = APIRouter(prefix="/auth", tags=["authentication"])


def delete_auth_code_after(code: str, expiration: int = AUTH_CODE_EXPIRATION):
    """
    Deletes the auth code after a specified amount of time.
    """
    time.sleep(expiration)
    CODE_EXCHANGE.pop(code, None)


def delete_device_code_after(code: str, expiration: int = AUTH_CODE_EXPIRATION):
    """
    Deletes the device code after a specified amount of time.
    """
    time.sleep(expiration)
    DEVICE_CODES.pop(code, None)


@auth.get("/user/keys")
def get_user_keys(session_info: Union[dict, None] = Depends(read_authorization_header)):
    if session_info:
        keys = dev_key_handler.get_keys_for_namespace(session_info["login"])

        # obfuscate the keys -- we never want to show the full key
        for key in keys:
            key.key = key.key[:5] + "*" * 10 + key.key[-5:]

        return {"keys": keys}

    else:
        raise HTTPException(status_code=401, detail="Invalid token")


@auth.post("/user/keys")
@limiter.limit("5/minute")
def mint_user_key(
    request: Request,
    session_info: Union[dict, None] = Depends(read_authorization_header),
):
    if session_info:
        key = dev_key_handler.mint_key_for_namespace(
            session_info["login"], session_info=session_info
        )
        return {"key": key}
    else:
        raise HTTPException(status_code=401, detail="Invalid token")


@auth.delete("/user/keys")
def delete_user_key(
    revoke_request: RevokeRequest,
    session_info: Union[dict, None] = Depends(read_authorization_header),
):
    if session_info:
        dev_key_handler.remove_key(
            session_info["login"], revoke_request.last_five_chars
        )
        return JSONResponse({"message": "Key deleted successfully."}, status_code=202)
    else:
        raise HTTPException(status_code=401, detail="Invalid token")


@auth.get("/login", response_class=RedirectResponse)
def login(
    client_redirect_uri: Union[str, None] = None,
    client_finally_send_to: Union[str, None] = None,
):
    """
    Redirects to log user in to GitHub. GitHub will pass a code to the callback URL.
    """
    state = {
        "client_redirect_uri": client_redirect_uri,
        "client_finally_send_to": client_finally_send_to,
        "secret": JWT_SECRET,
    }
    authorization_url = build_authorization_url(
        client_id=github_app_config.client_id,
        redirect_uri=github_app_config.redirect_uri,
        state=json.dumps(state),
    )
    return authorization_url


@auth.get("/callback")
def callback(
    background_tasks: BackgroundTasks,
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
    client_redirect_uri = state.get("client_redirect_uri")
    # Make a request to the following endpoint to receive an access token
    url = "https://github.com/login/oauth/access_token"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",  # specify we want json back, or else it gives a param string
    }
    github_acc_request_data = {
        "client_id": github_app_config.client_id,
        "client_secret": github_app_config.client_secret,
        "redirect_uri": github_app_config.redirect_uri,
        "code": code,
        "state": state,
    }
    x = requests.post(url, data=github_acc_request_data, headers=headers).json()
    # This contains the access token

    # Use the access token to get the username and organization memberships,
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

    if state.get("device"):
        DEVICE_CODES[state["device_code"]]["token"] = token
        return "/login/device/success"

    else:
        # create random auth code
        auth_code = generate_random_auth_code()

        # store the token in a global dict
        CODE_EXCHANGE[auth_code] = {
            "token": token,
            "client_redirect_uri": client_redirect_uri if client_redirect_uri else None,
        }

        # add background task to delete the token after EXP time
        background_tasks.add_task(
            delete_auth_code_after, auth_code, AUTH_CODE_EXPIRATION
        )

    # return token either to client_redirect,
    # or to a basic login success page.
    # add token as query param
    if client_redirect_uri:
        # add client_finally_send_to as query param if it exists
        if state.get("client_finally_send_to"):
            send_to = (
                client_redirect_uri
                + f"?code={auth_code}&client_finally_send_to={state['client_finally_send_to']}"
            )
        else:
            send_to = client_redirect_uri + f"?code={auth_code}"
    else:
        send_to = f"/auth/login/success?code={auth_code}"
    return RedirectResponse(url=send_to, status_code=302)


@auth.post("/token")
def code_exchange(exchange_request: TokenExchange):
    code = exchange_request.code
    client_redirect_uri = exchange_request.client_redirect_uri
    if code in CODE_EXCHANGE:
        try:
            if client_redirect_uri != CODE_EXCHANGE[code]["client_redirect_uri"]:
                raise HTTPException(
                    status_code=400,
                    detail="The provided client_redirect_uri is invalid. Please try logging in again.",
                )
            return CODE_EXCHANGE[code]
        finally:
            del CODE_EXCHANGE[code]
    else:
        raise HTTPException(status_code=400, detail="Invalid authorization code.")


@auth.post("/device/init")
def init_device_code(
    background_tasks: BackgroundTasks,
    request: Request,
):
    """
    Create random device code, so that device can exchange it later for token
    """
    device_code = generate_random_device_code()
    background_tasks.add_task(
        delete_device_code_after, device_code, AUTH_CODE_EXPIRATION
    )
    DEVICE_CODES[device_code] = {"token": None, "client_host": request.client.host}

    return InitializeDeviceCodeResponse(
        device_code=device_code,
        auth_url=f"{github_app_config.base_uri}/auth/device/login/{device_code}",
    )


@auth.get("/device/login/{device_code}", response_class=RedirectResponse)
def login_device(device_code: str):
    """
    Redirects to log user in to GitHub. GitHub will pass a code to the callback URL
        with state that was defined before redirecting to GitHub.
    :param device_code: the code that is used to exchange for token
    """
    if device_code in DEVICE_CODES:
        state = {
            "secret": JWT_SECRET,
            "device_code": device_code,
            "device": True,
        }
        return build_authorization_url(
            client_id=github_app_config.client_id,
            redirect_uri=github_app_config.redirect_uri,
            state=json.dumps(state),
        )
    else:
        # TODO: create webpage saying that device code was never initialized
        raise HTTPException(status_code=400, detail="Item not found")


@auth.post("/device/token")
def return_token(
    request: Request,
    device_code: Union[str, None] = Header(default=None),
):
    """
    Request token from PEPhub by passing device code in Header.
    """
    client_host = request.client.host

    if device_code in DEVICE_CODES.keys():
        if DEVICE_CODES.get(device_code).get("token"):
            if DEVICE_CODES[device_code].get("client_host") == client_host:
                token = DEVICE_CODES[device_code].get("token")
                DEVICE_CODES.pop(device_code)
                return JWTDeviceTokenResponse(jwt_token=token)
            else:
                raise HTTPException(status_code=401, detail="Incorrect host")
        else:
            raise HTTPException(status_code=401, detail="User didn't log in")
    else:
        raise HTTPException(status_code=400, detail="Item not found")


@auth.get("/login/success")
def login_success(request: Request):
    return templates.TemplateResponse(
        "login_success_default.html", {"request": request}
    )


@auth.get("/session")
def get_session_from_jwt(
    session_info: Union[dict, None] = Depends(read_authorization_header)
):
    if session_info:
        return session_info
    else:
        raise HTTPException(status_code=401, detail="Invalid token")
