import logging

import peprs
import yaml
from fastapi.exceptions import HTTPException
from peprs import Project
from peprs.eido import EidoValidationError, validate_config, validate_project
from peprs.const import (
    CONFIG_KEY,
    SAMPLE_RAW_DICT_KEY,
    SUBSAMPLE_RAW_DICT_KEY,
)
from ....dependencies import (
    get_db,
)

_LOGGER = logging.getLogger(__name__)
DEFAULT_SCHEMA_NAMESPACE = "databio"
DEFAULT_SCHEMA_NAME = "pep"
DEFAULT_SCHEMA_VERSION = "2.1.0"


async def verify_updated_project(updated_project) -> peprs.Project:
    new_raw_project = {}

    agent = get_db()
    default_schema = agent.schema.get(
        namespace=DEFAULT_SCHEMA_NAMESPACE,
        name=DEFAULT_SCHEMA_NAME,
        version=DEFAULT_SCHEMA_VERSION,
    )

    if not updated_project.sample_table or not updated_project.project_config_yaml:
        raise HTTPException(
            status_code=400,
            detail="Please provide a sample table and project config yaml to update project",
        )

    try:
        yaml_dict = yaml.safe_load(updated_project.project_config_yaml)
    except yaml.scanner.ScannerError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse provided yaml. Error: {e}",
        )

    new_raw_project[CONFIG_KEY] = yaml_dict
    new_raw_project[SAMPLE_RAW_DICT_KEY] = updated_project.sample_table

    # subsample table update
    if updated_project.subsample_tables is not None:
        subsamples = list(updated_project.subsample_tables[0][0].values())
        if len(subsamples) > 0 and subsamples[0]:
            new_raw_project[SUBSAMPLE_RAW_DICT_KEY] = updated_project.subsample_tables

    try:
        new_project = Project.from_dict(new_raw_project)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not create PEP from provided data. Error: {e}",
        )

    # peprs.eido.validate_config takes a Project (not a raw dict like eido did),
    # so we validate after constructing the Project.
    try:
        validate_config(new_project, default_schema)
    except EidoValidationError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Config structure error: {', '.join(list(e.errors_by_type.keys()))}. Please check schema definition and try again.",
        )

    try:
        # validate project (it will also validate samples)
        validate_project(new_project, default_schema)
    except Exception as _:
        raise HTTPException(
            status_code=400,
            detail="Could not validate PEP. Please check your PEP and try again.",
        )

    return new_project


async def check_sample_names(sample_list: list, sample_table_index_col: str) -> None:
    for sample in sample_list:
        if sample_table_index_col not in sample:
            raise HTTPException(
                status_code=400,
                detail="Sample table does not contain sample index column: "
                f"'{sample_table_index_col}'. Please check sample table",
            )
        if (
            sample[sample_table_index_col] is None
            or sample[sample_table_index_col] == ""
        ):
            raise HTTPException(
                status_code=400,
                detail="Sample name cannot be None or an empty string. Please check sample table",
            )
