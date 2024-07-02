import logging

import eido
import peppy
import yaml
from fastapi.exceptions import HTTPException
from peppy import Project
from peppy.const import (
    CONFIG_KEY,
    SAMPLE_NAME_ATTR,
    SAMPLE_RAW_DICT_KEY,
    SAMPLE_TABLE_INDEX_KEY,
    SUBSAMPLE_RAW_LIST_KEY,
)

_LOGGER = logging.getLogger(__name__)


async def verify_updated_project(updated_project) -> peppy.Project:
    new_raw_project = {}

    if not updated_project.sample_table or not updated_project.project_config_yaml:
        raise HTTPException(
            status_code=400,
            detail="Please provide a sample table and project config yaml to update project",
        )

    # sample table update
    new_raw_project[SAMPLE_RAW_DICT_KEY] = updated_project.sample_table

    try:
        yaml_dict = yaml.safe_load(updated_project.project_config_yaml)
        new_raw_project[CONFIG_KEY] = yaml_dict
    except yaml.scanner.ScannerError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse provided yaml. Error: {e}",
        )

    sample_table_index_col = yaml_dict.get(
        SAMPLE_TABLE_INDEX_KEY, SAMPLE_NAME_ATTR  # default to sample_name
    )

    await check_sample_names(
        new_raw_project[SAMPLE_RAW_DICT_KEY], sample_table_index_col
    )

    # subsample table update
    if updated_project.subsample_tables is not None:
        new_raw_project[SUBSAMPLE_RAW_LIST_KEY] = (
            updated_project.subsample_tables
            if list(updated_project.subsample_tables[0][0].values())[0]
            else None
        )

    try:
        new_project = Project.from_dict(new_raw_project)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not create PEP from provided data. Error: {e}",
        )

    try:
        # validate project (it will also validate samples)
        eido.validate_project(new_project, "http://schema.databio.org/pep/2.1.0.yaml")
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
