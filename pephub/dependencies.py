import os
import pydantic
import jwt
import json
import requests
import logging
import cairosvg

from secrets import token_hex
from dotenv import load_dotenv
from typing import Union, List, Optional, Tuple
from datetime import datetime, timedelta
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont, ImageOps

from fastapi import Depends, Header, Form
from fastapi.exceptions import HTTPException
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from peppy import Project
from pepdbagent import PEPDatabaseAgent
from pepdbagent.const import DEFAULT_TAG
from pepdbagent.exceptions import ProjectNotFoundError
from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import ResponseHandlingException
from sentence_transformers import SentenceTransformer

from .routers.models import AnnotationModel, NamespaceList, Namespace, ForkRequest
from .const import (
    DEFAULT_POSTGRES_HOST,
    DEFAULT_POSTGRES_PASSWORD,
    DEFAULT_POSTGRES_PORT,
    DEFAULT_POSTGRES_USER,
    DEFAULT_POSTGRES_DB,
    DEFAULT_QDRANT_HOST,
    DEFAULT_QDRANT_PORT,
    DEFAULT_HF_MODEL,
    JWT_EXPIRATION,
    JWT_SECRET,
)

_LOGGER_PEPHUB = logging.getLogger("uvicorn.access")

load_dotenv()

# Scheme for the Authorization header
token_auth_scheme = HTTPBearer()

ASSETS_PATH = os.path.join(os.path.dirname(__file__), "assets")


class UserData(BaseModel):
    login: str
    id: int
    organizations: Optional[List[str]]


class CLIAuthSystem:
    GITHUB_BASE_API_URL = "https://api.github.com"

    def get_jwt(self, access_token: str) -> str:
        """
        Based on access token request GitHub for user data and encode it using secret.
        """
        user_data = self._request_user_data_from_github(access_token)
        return self.jwt_encode_user_data(user_data.dict())

    @staticmethod
    def _request_user_data_from_github(access_token: str) -> UserData:
        response = requests.get(
            f"{CLIAuthSystem.GITHUB_BASE_API_URL}/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
        )
        try:
            return UserData(**json.loads(response.content.decode("utf-8")))
        except (
            AttributeError,
            UnicodeDecodeError,
            json.JSONDecodeError,
            pydantic.ValidationError,
        ):
            raise HTTPException(
                status_code=400,
                detail="Can't decode GitHub response. Please check it manually.",
            )

    @staticmethod
    def jwt_encode_user_data(user_data: dict) -> str:
        exp = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION)
        encoded_user_data = jwt.encode(
            {**user_data, "exp": exp}, JWT_SECRET, algorithm="HS256"
        )
        if isinstance(encoded_user_data, bytes):
            encoded_user_data = encoded_user_data.decode("utf-8")
        return encoded_user_data


agent = PEPDatabaseAgent(
    user=os.environ.get("POSTGRES_USER") or DEFAULT_POSTGRES_USER,
    password=os.environ.get("POSTGRES_PASSWORD") or DEFAULT_POSTGRES_PASSWORD,
    host=os.environ.get("POSTGRES_HOST") or DEFAULT_POSTGRES_HOST,
    database=os.environ.get("POSTGRES_DB") or DEFAULT_POSTGRES_DB,
    port=os.environ.get("POSTGRES_PORT") or DEFAULT_POSTGRES_PORT,
)


def generate_random_auth_code() -> str:
    """
    Generate a random 32-digit code.
    """
    n_bytes = int(32 / 2)
    return token_hex(n_bytes)


def generate_random_device_code() -> str:
    """
    Generate a random 8-digit code
    """
    n_bytes = int(8 / 2)
    return token_hex(n_bytes)


def get_db() -> PEPDatabaseAgent:
    """
    Grab a temporary connection to the database.
    """
    return agent


def read_authorization_header(Authorization: str = Header(None)) -> Union[str, None]:
    """
    Reads and decodes a JWT, returning the decoded variables.

    @param session_info_encoded: JWT provided via FastAPI injection from the API cookie.
    """
    if Authorization is None:
        return None
    else:
        Authorization = Authorization.replace("Bearer ", "")
    try:
        # Python jwt.decode verifies content as well so this is safe.
        session_info = jwt.decode(Authorization, JWT_SECRET, algorithms=["HS256"])
    except jwt.exceptions.InvalidSignatureError as e:
        _LOGGER_PEPHUB.error(e)
        return None
    except jwt.exceptions.DecodeError as e:
        _LOGGER_PEPHUB.error(e)
        return None
    except jwt.exceptions.ExpiredSignatureError:
        return HTTPException(status_code=401, detail="JWT has expired")
    return session_info


def get_organizations_from_session_info(
    session_info: Union[dict, None] = Depends(read_authorization_header)
) -> List[str]:
    organizations = []
    if session_info:
        organizations = session_info.get("orgs")
    return organizations


def get_user_from_session_info(
    session_info: Union[dict, None] = Depends(read_authorization_header)
) -> Union[str, None]:
    user = None
    if session_info:
        user = session_info.get("login")
    return user


def get_namespace_access_list(
    user: str = Depends(get_user_from_session_info),
    orgs: List[str] = Depends(get_organizations_from_session_info),
) -> List[str]:
    """
    Return a list of namespaces that the current user has access to. Function
    will return None if there is no logged in user
    """
    access_rights = []
    if user:
        access_rights.append(user)
        access_rights.extend(orgs)
        return access_rights
    else:
        return None


def get_project(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    try:
        proj = agent.project.get(namespace, project, tag)
        yield proj
    except ProjectNotFoundError:
        raise HTTPException(
            404,
            f"PEP '{namespace}/{project}:{tag or DEFAULT_TAG}' does not exist in database. Did you spell it correctly?",
        )


def get_project_annotation(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    namespace_access_list: List[str] = Depends(get_namespace_access_list),
) -> AnnotationModel:
    # TODO: Is just grabbing the first annotation the right thing to do?
    try:
        anno = agent.annotation.get(
            namespace, project, tag, admin=namespace_access_list
        ).results[0]
        yield anno
    except ProjectNotFoundError:
        raise HTTPException(
            404,
            f"PEP '{namespace}/{project}:{tag or DEFAULT_TAG}' does not exist in database. Did you spell it correctly?",
        )


# TODO: This isn't used; do we still need it?
def get_namespaces(
    agent: PEPDatabaseAgent = Depends(get_db),
    user: str = Depends(get_user_from_session_info),
) -> List[NamespaceList]:
    yield agent.namespace.get(admin=user)


def verify_user_can_write_namespace(
    namespace: str,
    session_info: Union[dict, None] = Depends(read_authorization_header),
    orgs: List = Depends(get_organizations_from_session_info),
):
    """
    Authorization flow for writing to a namespace.

    See: https://github.com/pepkit/pephub/blob/master/docs/authentication.md#submiting-a-new-pep
    """
    if session_info is None:
        raise HTTPException(
            401,
            f"User must be logged in to write to namespace: '{namespace}'.",
        )
    if session_info["login"] != namespace and namespace not in orgs:
        raise HTTPException(
            403,
            f"User does not have permission to write to namespace: '{namespace}'.",
        )


def verify_user_can_read_project(
    project: str,
    namespace: str,
    tag: Optional[str] = DEFAULT_TAG,
    project_annotation: AnnotationModel = Depends(get_project_annotation),
    session_info: Union[dict, None] = Depends(read_authorization_header),
    orgs: List = Depends(get_organizations_from_session_info),
):
    """
    Authorization flow for reading a project from the database.

    See: https://github.com/pepkit/pephub/blob/master/docs/authentication.md#reading-peps
    """
    if project_annotation.is_private:
        if session_info is None:
            # raise 404 since we don't want to reveal that the project exists
            raise HTTPException(
                404, f"Project, '{namespace}/{project}:{tag}', not found."
            )
        elif any(
            [
                session_info.get("login") != namespace
                and namespace
                not in orgs,  # user doesnt own namespace or is not member of organization
            ]
        ):
            # raise 404 since we don't want to reveal that the project exists
            raise HTTPException(
                404, f"Project, '{namespace}/{project}:{tag}', not found."
            )


def verify_user_can_write_project(
    project: str,
    namespace: str,
    tag: Optional[str] = DEFAULT_TAG,
    project_annotation: AnnotationModel = Depends(get_project_annotation),
    session_info: Union[dict, None] = Depends(read_authorization_header),
    orgs: List = Depends(get_organizations_from_session_info),
):
    """
    Authorization flow for writing a project to the database.

    See: https://github.com/pepkit/pephub/blob/master/docs/authentication.md#writing-peps
    """
    if project_annotation.is_private:
        if session_info is None:  # user not logged in
            # raise 404 since we don't want to reveal that the project exists
            raise HTTPException(
                404, f"Project, '{namespace}/{project}:{tag}', not found."
            )
        elif any(
            [
                session_info["login"] != namespace
                and namespace
                not in orgs,  # user doesnt own namespace or is not member of organization
            ]
        ):
            # raise 404 since we don't want to reveal that the project exists
            raise HTTPException(
                404, f"Project, '{namespace}/{project}:{tag}', not found."
            )
    else:
        # AUTHENTICATION REQUIRED
        if session_info is None:
            raise HTTPException(
                401,
                f"Please authenticate before editing project.",
            )
        # AUTHORIZATION REQUIRED
        if session_info["login"] != namespace and namespace not in orgs:
            raise HTTPException(
                403,
                f"The current authenticated user does not have permission to edit this project.",
            )


def verify_user_can_fork(
    fork_request: ForkRequest,
    namespace_access_list: List[str] = Depends(get_namespace_access_list),
) -> bool:
    fork_namespace = fork_request.fork_to
    if fork_namespace in (namespace_access_list or []):
        yield
    else:
        raise HTTPException(401, "Unauthorized to fork this repo")


def parse_boolean_env_var(env_var: str) -> bool:
    """
    Helper function to parse a boolean environment variable
    """
    return env_var.lower() in ["true", "1", "t", "y", "yes"]


def get_qdrant_enabled() -> bool:
    """
    Check if qdrant is enabled
    """
    return parse_boolean_env_var(os.environ.get("QDRANT_ENABLED", "false"))


def get_qdrant(
    qdrant_enabled: bool = Depends(get_qdrant_enabled),
) -> Union[QdrantClient, None]:
    """
    Return connection to qdrant client
    """
    # return None if qdrant is not enabled
    if not qdrant_enabled:
        try:
            yield None
        finally:
            pass
    # else try to connect, test connectiona and return client if connection is successful.
    qdrant = QdrantClient(
        url=os.environ.get("QDRANT_HOST", DEFAULT_QDRANT_HOST),
        port=os.environ.get("QDRANT_PORT", DEFAULT_QDRANT_PORT),
        api_key=os.environ.get("QDRANT_API_KEY", None),
    )
    try:
        # test the connection first
        qdrant.list_full_snapshots()
        yield qdrant
    except ResponseHandlingException as e:
        print(f"Error getting qdrant client: {e}")
        yield None
    finally:
        # no need to close the connection
        pass


def get_sentence_transformer() -> SentenceTransformer:
    """
    Return sentence transformer encoder
    """
    model = SentenceTransformer(os.getenv("HF_MODEL", DEFAULT_HF_MODEL))
    try:
        yield model
    finally:
        # no need to do anything
        pass


def get_namespace_info(
    namespace: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    user: str = Depends(get_user_from_session_info),
) -> Namespace:
    """
    Get the information on a namespace, if it exists.
    """
    # TODO: is this the best way to do this? By grabbing the first result?
    try:
        yield agent.namespace.get(query=namespace, admin=user).results[0]
    except IndexError:
        # namespace doesnt exist in database, so we must return a blank namespace
        yield Namespace(
            namespace=namespace,
            number_of_projects=0,
            number_of_samples=0,
        )


def verify_namespace_exists(namespace: str, agent: PEPDatabaseAgent = Depends(get_db)):
    if not agent.namespace.get(query=namespace):
        raise HTTPException(
            404,
            f"Namespace '{namespace}' does not exist in database. Did you spell it correctly?",
        )
    else:
        yield namespace

def create_rounded_corner_mask(size: Tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse((0, 0, radius * 2, radius * 2), fill=255)
    mask_draw.rectangle((radius, 0, size[0] - radius, size[1]), fill=255)
    mask_draw.rectangle((0, radius, size[0], size[1] - radius), fill=255)
    mask_draw.ellipse((size[0] - radius * 2, 0, size[0], radius * 2), fill=255)
    mask_draw.ellipse((0, size[1] - radius * 2, radius * 2, size[1]), fill=255)
    mask_draw.ellipse((size[0] - radius * 2, size[1] - radius * 2, size[0], size[1]), fill=255)
    return mask

def project_to_open_graph_image(
        namespace: str,
        project: str,
        tag: Optional[str] = DEFAULT_TAG,
        proj_obj: Project = None,
    ) -> Image.Image:
    """
    Convert a project to an open graph image
    """

    def svg_to_image(svg_path: str, size: Tuple[int, int]) -> Image.Image:
        with open(svg_path, 'r') as svg_file:
            svg_data = svg_file.read()
        
        png_data = BytesIO()
        cairosvg.svg2png(bytestring=svg_data, write_to=png_data, dpi=192)
        png_data.seek(0)
        img = Image.open(png_data)
        img.thumbnail(size)
        return img

    scale_factor = 2

    image = Image.new("RGB", (1200 * scale_factor, 630 * scale_factor), color="white")
    draw = ImageDraw.Draw(image)

    # title font should be 100
    title_font = ImageFont.truetype(f"{ASSETS_PATH}/Roboto-Bold.ttf", 60 * scale_factor)

    # description font should be 50
    description_font = ImageFont.truetype(f"{ASSETS_PATH}/Roboto-Regular.ttf", 30 * scale_factor)

    # add icon to upper left corner
    response = requests.get(f"https://github.com/{namespace}.png")
    avatar = Image.open(BytesIO(response.content))
    avatar = avatar.resize((150 * scale_factor, 150 * scale_factor))

    # round corners
    corner_radius = 20 * scale_factor
    mask = create_rounded_corner_mask(avatar.size, corner_radius)
    rounded_avatar = ImageOps.fit(avatar, mask.size, centering=(0.5, 0.5))
    rounded_avatar.putalpha(mask)
    image.paste(rounded_avatar, (100 * scale_factor, 100 * scale_factor), mask=rounded_avatar)

    # add project registry path as title
    registry_path = f"{namespace}/{project}:{tag}"

    # add project description as description
    description = proj_obj.description

    # add to bottom of image
    draw.text((100 * scale_factor, 300 * scale_factor), registry_path, font=title_font, fill="black")
    draw.text((100 * scale_factor, 375 * scale_factor), description, font=description_font, fill="black")

    # Update description_font size and color
    info_font = ImageFont.truetype(f"{ASSETS_PATH}/Roboto-Regular.ttf", 24 * scale_factor)
    info_color = (128, 128, 128)  # Light gray color

    # Load and resize the icons for samples, project version, and favorites
    samples_icon = svg_to_image(f"{ASSETS_PATH}/hash.svg", (30 * scale_factor, 30 * scale_factor))
    version_icon = svg_to_image(f"{ASSETS_PATH}/hammer.svg", (30 * scale_factor, 30 * scale_factor))
    favorites_icon = svg_to_image(f"{ASSETS_PATH}/stars.svg", (30 * scale_factor, 30 * scale_factor))

    # Draw the icons at the bottom of the image
    image.paste(samples_icon, (100 * scale_factor, 500 * scale_factor))
    image.paste(version_icon, (450 * scale_factor, 500 * scale_factor))
    image.paste(favorites_icon, (800 * scale_factor, 500 * scale_factor))

    # Draw the icons at the bottom of the image
    image.paste(samples_icon, (100 * scale_factor, 500 * scale_factor))
    image.paste(version_icon, (450 * scale_factor, 500 * scale_factor))
    image.paste(favorites_icon, (800 * scale_factor, 500 * scale_factor))

    # Draw the text for the number of samples, project version, and the number of favorites
    draw.text((150 * scale_factor, 500 * scale_factor), str(len(proj_obj.samples)), font=info_font, fill=info_color)
    draw.text((500 * scale_factor, 500 * scale_factor), str(proj_obj.pep_version), font=info_font, fill=info_color)
    draw.text((850 * scale_factor, 500 * scale_factor), str(0), font=info_font, fill=info_color)

    # Draw labels for each value
    label_color = (96, 96, 96)  # Darker gray color
    draw.text((150 * scale_factor, 470 * scale_factor), "Samples", font=info_font, fill=label_color)
    draw.text((500 * scale_factor, 470 * scale_factor), "Version", font=info_font, fill=label_color)
    draw.text((850 * scale_factor, 470 * scale_factor), "Favorites", font=info_font, fill=label_color)

    image = image.resize((1200, 630), Image.ANTIALIAS)

    return image


