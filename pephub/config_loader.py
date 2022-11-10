import os

from pydantic import BaseSettings


PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))


class ConfigLoader(BaseSettings):

    JWT_SECRET: str = ""

    class Config:
        env_file = os.environ.get(
            "ENV_FILE", os.path.join(PROJECT_ROOT, "environment", "local.env")
        )


config = ConfigLoader()
