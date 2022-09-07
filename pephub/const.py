import os

PKG_NAME = "pephub"
DATA_REPO = "https://github.com/pepkit/data.pephub.git"

LOG_FORMAT = "%(levelname)s in %(funcName)s: %(message)s"

DEFAULT_PORT = "80"
DEFAULT_POSTGRES_HOST = "0.0.0.0"
DEFAULT_POSTGRES_USER = "postgres"
DEFAULT_POSTGRES_PASSWORD = "docker"
DEFAULT_POSTGRES_PORT = 5432
DEFAULT_POSTGRES_DB = "pep-db"


EIDO_TEMPLATES_DIRNAME = "templates/eido"
EIDO_TEMPLATES_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), EIDO_TEMPLATES_DIRNAME
)

BASE_TEMPLATES_DIRNAME = "templates/base"
BASE_TEMPLATES_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), BASE_TEMPLATES_DIRNAME
)

STATICS_DIRNAME = "static"
STATICS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), STATICS_DIRNAME)

EIDO_DIRNAME = "eido_validator"
EIDO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), EIDO_DIRNAME)


TAGS_METADATA = [
    {"name": "root", "description": "Base route for API."},
    {
        "name": "namespace",
        "description": "Manage and obtain information about a particular namespace",
    },
    {
        "name": "project",
        "description": "Manage and obtain information about a particular project or PEP.",
    },
]
