import json
import os

dirname = os.path.dirname(__file__)

import requests


def _constuct_query(endpoint: str) -> str:
    return f"http://localhost:8000{endpoint}"


def test_validate_project():

    test_config = os.path.join(dirname, "data/project_config.yaml")
    test_table = os.path.join(dirname, "data/sample_table.csv")

    res = requests.post(
        _constuct_query("/validate/project"),
        files=[
            ("files", ("project_config.yaml", open(test_config))),
            ("files", ("sample_table.csv", open(test_table))),
        ],
    )

    data = res.json()
    assert len(data) == 5  # there are 5 schemas to test
