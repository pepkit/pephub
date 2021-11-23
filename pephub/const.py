PKG_NAME = "pephub"
DATA_REPO = "https://github.com/pepkit/data.pephub.git"
PEP_STORAGE_PATH = "/app/pephub/data"
LOG_FORMAT = "%(levelname)s in %(funcName)s: %(message)s"

DEFAULT_PORT = "80"

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