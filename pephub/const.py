import logging
import os
import pandas as pd
from ._version import __version__ as pephub_version
from peppy import __version__ as peppy_version
from peppy.const import PEP_LATEST_VERSION
from platform import python_version
from fastapi import __version__ as fastapi_version
from pepdbagent import __version__ as pepdbagent_version
from pepdbagent.const import DEFAULT_TAG

from secrets import token_hex

PKG_NAME = "pephub"
DATA_REPO = "https://github.com/pepkit/data.pephub.git"


ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peppy_version": peppy_version,
    "python_version": python_version(),
    "fastapi_version": fastapi_version,
    "pepdbagent_version": pepdbagent_version,
    "api_version": 1,
}

DEFAULT_PORT = "80"
DEFAULT_POSTGRES_HOST = "0.0.0.0"
DEFAULT_POSTGRES_USER = "postgres"
DEFAULT_POSTGRES_PASSWORD = "docker"
DEFAULT_POSTGRES_PORT = 5432
DEFAULT_POSTGRES_DB = "pephub"

DEFAULT_QDRANT_HOST = "localhost"
DEFAULT_QDRANT_PORT = 6333
DEFAULT_QDRANT_COLLECTION_NAME = "pephub"


BLANK_PEP_CONFIG = {
    "pep_version": PEP_LATEST_VERSION,
    "sample_table": "sample_table.csv",
}
BLANK_PEP_SAMPLES = [
    {
        "sample_name": "sample1",
        "fastq_1": "sample1_R1.fastq.gz",
        "fastq_2": "sample1_R2.fastq.gz",
    },
    {
        "sample_name": "sample2",
        "fastq_1": "sample2_R1.fastq.gz",
        "fastq_2": "sample2_R2.fastq.gz",
    },
    {
        "sample_name": "sample3",
        "fastq_1": "sample3_R1.fastq.gz",
        "fastq_2": "sample3_R2.fastq.gz",
    },
]
BLANK_PEP_SAMPLE_TABLE = pd.DataFrame(
    BLANK_PEP_SAMPLES, columns=["sample_name", "fastq_1", "fastq_2"]
).to_csv(index=False)

# https://arxiv.org/abs/2210.07316
# figure 4
# great speed to accuracy tradeoff
DEFAULT_HF_MODEL = "sentence-transformers/all-MiniLM-L12-v2"

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

SPA_PATH = "web/dist"

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


SAMPLE_CONVERSION_FUNCTIONS = {
    "json": lambda x: x.to_json(),
    "csv": lambda x: x.to_csv(index=False),
    "latex": lambda x: x.to_latex(),
    "txt": lambda x: x.to_string(),
}

VALID_UPDATE_KEYS = [
    "name",
    "is_private",
    "tag",
    "private",
    "description",
    "pep_schema",
]


LOG_LEVEL_MAP = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL,
}

JWT_SECRET = token_hex(32)
JWT_EXPIRATION = 4320  # 3 days in minutes
JWT_EXPIRATION_SECONDS = JWT_EXPIRATION * 60  # seconds

AUTH_CODE_EXPIRATION = 5 * 60  # seconds

CALLBACK_ENDPOINT = "/auth/callback"

DEFAULT_PEP_SCHEMA = "pep/2.1.0"
