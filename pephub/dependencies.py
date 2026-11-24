import logging
import os
from secrets import token_hex
from typing import Any, Dict, List, Optional, Union

import jwt
from cachetools import TTLCache, cached
from dotenv import load_dotenv
from fastapi import Depends, Header, Query
from fastapi.exceptions import HTTPException
from fastapi.security import HTTPBearer
from pepdbagent import PEPDatabaseAgent
from pepdbagent.const import DEFAULT_TAG
from pepdbagent.db_utils import Projects, User
from pepdbagent.exceptions import ProjectNotFoundError
from pepdbagent.models import AnnotationModel, ListOfNamespaceInfo, Namespace
from qdrant_client import QdrantClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .const import (
    DEFAULT_POSTGRES_DB,
    DEFAULT_POSTGRES_HOST,
    DEFAULT_POSTGRES_PASSWORD,
    DEFAULT_POSTGRES_PORT,
    DEFAULT_POSTGRES_USER,
    DEFAULT_QDRANT_COLLECTION_NAME,
    DEFAULT_QDRANT_HOST,
    DEFAULT_QDRANT_PORT,
    DENSE_ENCODER_MODEL,
    JWT_SECRET,
    PKG_NAME,
    SPARSE_ENCODER_MODEL,
)
from .developer_keys import dev_key_handler
from .embedding import (
    Encoder,
    EncoderConfigError,
    EncoderUnavailable,
    LocalEncoder,
    TEIEncoder,
)
from .routers.models import ForkRequest

_LOGGER_PEPHUB = logging.getLogger(PKG_NAME)

load_dotenv()

# Scheme for the Authorization header
token_auth_scheme = HTTPBearer()


# database connection
agent = PEPDatabaseAgent(
    user=os.environ.get("POSTGRES_USER") or DEFAULT_POSTGRES_USER,
    password=os.environ.get("POSTGRES_PASSWORD") or DEFAULT_POSTGRES_PASSWORD,
    host=os.environ.get("POSTGRES_HOST") or DEFAULT_POSTGRES_HOST,
    database=os.environ.get("POSTGRES_DB") or DEFAULT_POSTGRES_DB,
    port=os.environ.get("POSTGRES_PORT") or DEFAULT_POSTGRES_PORT,
)


## Qdrant connection
def parse_boolean_env_var(env_var: str) -> bool:
    """
    Helper function to parse a boolean environment variable
    """
    return env_var.lower() in ["true", "1", "t", "y", "yes"]


def initialize_qdrant_client() -> Union[QdrantClient, None]:
    """
    Initialize Qdrant client if enabled
    """

    if parse_boolean_env_var(os.environ.get("QDRANT_ENABLED", "false")):
        try:
            qdrant = QdrantClient(
                url=os.environ.get("QDRANT_HOST", DEFAULT_QDRANT_HOST),
                port=os.environ.get("QDRANT_PORT", DEFAULT_QDRANT_PORT),
                api_key=os.environ.get("QDRANT_API_KEY", None),
            )
            qdrant.list_full_snapshots()
            return qdrant
        except Exception as e:
            _LOGGER_PEPHUB.error(f"Error connecting to Qdrant: {e}")

    else:
        _LOGGER_PEPHUB.warning(
            "QDRANT_ENABLED is not set to true. Qdrant features will be disabled.\
            To enable Qdrant, set the environment variable QDRANT_ENABLED to 'true'."
        )
    return None


qdrant = initialize_qdrant_client()


def initialize_encoder() -> Encoder:
    """
    Build the query encoder from the EMBEDDING_* settings. EMBEDDING_MODE=local
    (the default) loads the models in this process; EMBEDDING_MODE=tei calls TEI
    servers instead. Either way, the models must be the ones the Qdrant index was
    built with.
    """
    mode = os.environ.get("EMBEDDING_MODE", "local").strip().lower()
    dense_model = os.environ.get("EMBEDDING_DENSE_MODEL") or DENSE_ENCODER_MODEL
    sparse_model = os.environ.get("EMBEDDING_SPARSE_MODEL") or SPARSE_ENCODER_MODEL
    if mode == "local":
        return LocalEncoder(dense_model, sparse_model)
    if mode == "tei":
        dense_url = os.environ.get("EMBEDDING_DENSE_URL")
        if not dense_url:
            raise EncoderConfigError("EMBEDDING_MODE=tei requires EMBEDDING_DENSE_URL")
        return TEIEncoder(
            dense_url=dense_url,
            dense_model=dense_model,
            sparse_url=os.environ.get("EMBEDDING_SPARSE_URL") or None,
            sparse_model=sparse_model,
            api_key=os.environ.get("EMBEDDING_API_KEY") or None,
        )
    raise EncoderConfigError(f"Unknown EMBEDDING_MODE '{mode}'. Use 'local' or 'tei'.")


def build_encoder(qdrant: Union[QdrantClient, None]) -> Union[Encoder, None]:
    """
    Build the encoder and check it against its servers and the Qdrant collection.
    Bad settings stop the server. An embedding server that is down at startup
    does not: the rest of pephub works, and searches return 503 until it is back.
    """
    if qdrant is None:
        return None
    encoder = initialize_encoder()
    try:
        encoder.check()
        dense_size = len(encoder.embed_dense("pephub dimension check"))
    except EncoderUnavailable as e:
        _LOGGER_PEPHUB.error(f"Embedding server not reachable, checks skipped: {e}")
        return encoder
    try:
        params = qdrant.get_collection(DEFAULT_QDRANT_COLLECTION_NAME).config.params
    except Exception as e:
        _LOGGER_PEPHUB.warning(
            f"Could not read Qdrant collection '{DEFAULT_QDRANT_COLLECTION_NAME}' "
            f"({e}); skipping vector checks."
        )
        return encoder

    collection = f"Qdrant collection '{DEFAULT_QDRANT_COLLECTION_NAME}'"
    vectors = params.vectors
    if isinstance(vectors, dict) and "dense" in vectors:
        if dense_size != vectors["dense"].size:
            raise EncoderConfigError(
                f"dense vectors are {dense_size}-d but {collection} expects "
                f"{vectors['dense'].size}-d"
            )
    collection_has_sparse = "sparse" in (params.sparse_vectors or {})
    if encoder.has_sparse and not collection_has_sparse:
        raise EncoderConfigError(f"{collection} has no 'sparse' vector")
    if collection_has_sparse and not encoder.has_sparse:
        raise EncoderConfigError(
            f"{collection} has a 'sparse' vector, so set EMBEDDING_SPARSE_URL"
        )
    _LOGGER_PEPHUB.info("Embeddings: " + encoder.describe())
    return encoder


encoder = build_encoder(qdrant)


def get_qdrant() -> Union[QdrantClient, None]:
    """
    Return connection to qdrant client
    """

    return qdrant


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


def read_authorization_header(authorization: str = Header(None)) -> Union[dict, None]:
    """
    Reads and decodes a JWT, returning the decoded variables.

    :param Authorization: JWT provided via FastAPI injection from the API cookie.
    """
    if authorization is None:
        return None
    else:
        authorization = authorization.replace("Bearer ", "")
    try:
        # Python jwt.decode verifies content as well so this is safe.
        # check last 5 chars
        if dev_key_handler.is_key_bad(authorization[-5:]):
            raise HTTPException(401, "JWT has been revoked")
        session_info = jwt.decode(authorization, JWT_SECRET, algorithms=["HS256"])
    except jwt.exceptions.InvalidSignatureError as e:
        _LOGGER_PEPHUB.error(e)
        return None
    except jwt.exceptions.DecodeError as e:
        _LOGGER_PEPHUB.error(e)
        return None
    except jwt.exceptions.ExpiredSignatureError as e:
        # raise HTTPException(status_code=401, detail="JWT has expired")
        _LOGGER_PEPHUB.error(e)
        return None
    return session_info


def get_organizations_from_session_info(
    session_info: Union[dict, None] = Depends(read_authorization_header),
) -> List[str]:
    """Return the user's organizations from the token, lowercased."""
    orgs = (session_info or {}).get("orgs") or []
    return [org.lower() for org in orgs]


def get_user_from_session_info(
    session_info: Union[dict, None] = Depends(read_authorization_header),
) -> Union[str, None]:
    user = None
    if session_info:
        user = session_info.get("login")
        if user:
            user = user.lower()
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
        access_rights = [x.lower() for x in access_rights]
        return access_rights
    else:
        return []


def get_project(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    with_id: Optional[bool] = Query(
        False,
        description="Return the project with the samples pephub_id",
        include_in_schema=False,
    ),
) -> Dict[str, Any]:  # type: ignore
    try:
        proj = agent.project.get(namespace, project, tag, raw=True, with_id=with_id)
        yield proj
    except ProjectNotFoundError:
        raise HTTPException(
            404,
            f"PEP '{namespace}/{project}:{tag or DEFAULT_TAG}' does not exist in database. Did you spell it correctly?",
        )


def get_config(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
) -> Dict[str, Any]:  # type: ignore
    try:
        config = agent.project.get_config(namespace, project, tag)
        yield config
    except ProjectNotFoundError:
        raise HTTPException(
            404,
            f"PEP '{namespace}/{project}:{tag or DEFAULT_TAG}' does not exist in database. Did you spell it correctly?",
        )


def get_subsamples(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
) -> Dict[str, Any]:  # type: ignore # type: ignore
    try:
        subsamples = agent.project.get_subsamples(namespace, project, tag)
        yield subsamples
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
) -> AnnotationModel:  # type: ignore
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


def verify_user_can_write_namespace(
    namespace: str,
    access_list: List[str] = Depends(get_namespace_access_list),
):
    """
    Authorization flow for writing to a namespace.

    See: https://github.com/pepkit/pephub/blob/master/docs/authentication.md#submiting-a-new-pep
    """
    if not access_list:
        raise HTTPException(
            401,
            f"User must be logged in to write to the namespace: '{namespace}'.",
        )
    if namespace not in access_list:
        raise HTTPException(
            403,
            f"User does not have permission to write or make modifications to the namespace: '{namespace}'.",
        )
    return access_list


def verify_user_can_read_project(
    namespace: str,
    project: str,
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
        elif (
            # user doesnt own namespace and is not a member of the organization
            session_info.get("login") != namespace and namespace not in orgs
        ):
            # raise 404 since we don't want to reveal that the project exists
            raise HTTPException(
                404, f"Project, '{namespace}/{project}:{tag}', not found."
            )


def verify_user_can_fork(
    fork_request: ForkRequest,
    namespace_access_list: List[str] = Depends(get_namespace_access_list),
) -> bool:  # type: ignore
    fork_namespace = fork_request.fork_to
    if fork_namespace in (namespace_access_list or []):
        yield
    else:
        raise HTTPException(401, "Unauthorized to fork this repo")


def get_encoder() -> Union[Encoder, None]:
    """
    Return the query encoder (local models or a TEI server), or None when
    Qdrant is disabled
    """
    return encoder


def get_namespace_info(
    namespace: str,
    agent: PEPDatabaseAgent = Depends(get_db),
) -> Namespace:
    """
    Get the information on a namespace, if it exists.

    Counts include private projects, like pepdbagent's namespace.info().
    """
    with Session(agent.connection) as session:
        number_of_projects = session.scalar(
            select(User.number_of_projects).where(User.namespace == namespace)
        )
        if number_of_projects is None:
            return Namespace(
                namespace=namespace,
                number_of_projects=0,
                number_of_samples=0,
            )
        number_of_samples = session.scalar(
            select(func.coalesce(func.sum(Projects.number_of_samples), 0)).where(
                Projects.namespace == namespace
            )
        )
    return Namespace(
        namespace=namespace,
        number_of_projects=number_of_projects,
        number_of_samples=number_of_samples,
    )


@cached(TTLCache(maxsize=100, ttl=5 * 60))
def get_pepdb_namespace_info(
    page: int = 0,
    page_size: int = 10,
    order_by: str = "number_of_projects",
) -> ListOfNamespaceInfo:
    """
    Get the information on the biggest namespaces in the database.
    """
    return agent.namespace.info(
        page=page,
        page_size=page_size,
        order_by=order_by,
    )
