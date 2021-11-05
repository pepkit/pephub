PKG_NAME = "pephub"
DATA_REPO = "https://github.com/pepkit/data.pephub.git"
PEP_STORAGE_PATH = "/app/pephub/data"
LOG_FORMAT = "%(levelname)s in %(funcName)s: %(message)s"
DEFAULT_PORT = "80"
TEST_SCHEMA = {
    "Generic PEP": "http://schema.databio.org/pep/2.0.0.yaml",
    "PEPPRO": "http://schema.databio.org/pipelines/ProseqPEP.yaml",
    "PEPATAC": "http://schema.databio.org/pipelines/pepatac.yaml",
    "bedmaker": "http://schema.databio.org/pipelines/bedmaker.yaml",
    "refgenie": "http://schema.databio.org/refgenie/refgenie_build.yaml",
    # "bulker": "http://schema.databio.org/bulker/manifest.yaml", # bulker schema not accpeted from eido
}
