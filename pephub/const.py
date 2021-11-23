import os

PKG_NAME = "pephub"
DATA_REPO = "https://github.com/pepkit/data.pephub.git"

LOG_FORMAT = "%(levelname)s in %(funcName)s: %(message)s"

DEFAULT_PORT = "80"

TEMPLATES_DIRNAME = "templates"
TEMPLATES_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), TEMPLATES_DIRNAME
)

STATICS_DIRNAME = "static"
STATICS_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), STATICS_DIRNAME
)

TAGS_METADATA = [
    {
        "name": "root",
        "description": "Base route for API."
    },
    {
        "name": "namespace",
        "description": "Manage and obtain information about a particular namespace"
    },
    {
        "name": "project",
        "description": "Manage and obtain information about a particular project or PEP."
    }
]