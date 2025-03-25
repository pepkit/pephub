import io
import zipfile
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Tuple, Union

import jwt
import pandas as pd
import yaml
import json
from fastapi import Response, UploadFile
from fastapi.exceptions import HTTPException
from peppy.const import (
    CFG_SAMPLE_TABLE_KEY,
    CFG_SUBSAMPLE_TABLE_KEY,
    CONFIG_KEY,
    NAME_KEY,
    SAMPLE_RAW_DICT_KEY,
    SUBSAMPLE_RAW_LIST_KEY,
)
from .const import JWT_EXPIRATION, JWT_SECRET


def jwt_encode_user_data(user_data: dict, exp: datetime = None) -> str:
    """
    Encode user data into a JWT token.

    :param user_data: user data to encode
    :param exp: expiration time for the token
    """
    exp = exp or datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION)
    encoded_user_data = jwt.encode(
        {**user_data, "exp": exp}, JWT_SECRET, algorithm="HS256"
    )
    if isinstance(encoded_user_data, bytes):
        encoded_user_data = encoded_user_data.decode("utf-8")
    return encoded_user_data


def zip_pep(project: Dict[str, Any]) -> Response:
    """
    Zip a project up to download

    :param project: peppy project to zip
    """

    content_to_zip = {}
    config = project[CONFIG_KEY]
    project_name = config[NAME_KEY]

    if project[SAMPLE_RAW_DICT_KEY] is not None:
        config[CFG_SAMPLE_TABLE_KEY] = "sample_table.csv"
        content_to_zip["sample_table.csv"] = pd.DataFrame(
            project[SAMPLE_RAW_DICT_KEY]
        ).to_csv(index=False)

    if project[SUBSAMPLE_RAW_LIST_KEY] is not None:
        if not isinstance(project[SUBSAMPLE_RAW_LIST_KEY], list):
            config[CFG_SUBSAMPLE_TABLE_KEY] = ["subsample_table1.csv"]
            content_to_zip["subsample_table1.csv"] = pd.DataFrame(
                project[SUBSAMPLE_RAW_LIST_KEY]
            ).to_csv(index=False)
        else:
            config[CFG_SUBSAMPLE_TABLE_KEY] = []
            for number, file in enumerate(project[SUBSAMPLE_RAW_LIST_KEY]):
                file_name = f"subsample_table{number + 1}.csv"
                config[CFG_SUBSAMPLE_TABLE_KEY].append(file_name)
                content_to_zip[file_name] = pd.DataFrame(file).to_csv(index=False)

    content_to_zip[f"{project_name}_config.yaml"] = yaml.dump(config, indent=4)

    zip_filename = project_name or f"downloaded_pep_{date.today()}"
    return zip_conv_result(content_to_zip, filename=zip_filename)


def zip_conv_result(conv_result: dict, filename: str = "project.zip") -> Response:
    """
    Given a dictionary of converted results, zip them up and return a response

    :param conv_result: dictionary of converted results
    :param filename: name of the zip
    return Response: response object
    """
    mf = io.BytesIO()

    with zipfile.ZipFile(mf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name, res in conv_result.items():
            # Add file, at correct path
            zf.writestr(name, str.encode(res))

    # Grab ZIP file from in-memory, make response with correct MIME-type
    resp = Response(
        mf.getvalue(),
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": f"attachment;filename={filename}"},
    )

    return resp


def download_yaml(content: dict, file_name: str = "unnamed.yaml") -> Response:
    """
    Convert json/dict to downloading io format

    :param content: content of the file
    :param file_name: name of the file
    return Response: response object
    """

    yaml_string = yaml.dump(content)

    yaml_bytes = io.BytesIO()
    yaml_bytes.write(yaml_string.encode("utf-8"))
    yaml_bytes.seek(0)  # Move the pointer to the start of the stream

    # Create a streaming response with the YAML data
    return Response(
        yaml_bytes.getvalue(),
        media_type="application/x-yaml",
        headers={"Content-Disposition": f"attachment; filename={file_name}"},
    )


def download_json(content: dict, file_name: str = "unnamed.json") -> Response:
    """
    Convert json/dict to downloading io format

    :param content: content of the file
    :param file_name: name of the file
    return Response: response object
    """

    json_string = json.dumps(content)

    json_bytes = io.BytesIO()
    json_bytes.write(json_string.encode("utf-8"))
    json_bytes.seek(0)  # Move the pointer to the start of the stream

    # Create a streaming response with the JSON data
    return Response(
        json_bytes.getvalue(),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={file_name}"},
    )


def build_authorization_url(
    client_id: str,
    redirect_uri: str,
    state: str,
) -> str:
    """
    Helper function to build an authorization url
    for logging in with GitHub
    """
    auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&state={state}&scope=read:org"
    return auth_url


def find_yaml_file_in_file_list(files: List[UploadFile]) -> Union[UploadFile, None]:
    """
    Given a list of files uploaded by a user, find the
    file that ends with `.yaml` and return it. If no file
    is found, return None
    """
    for file in files:
        if file.filename.endswith(".yaml"):
            return file
    return None


def find_csv_file_in_file_list(files: List[UploadFile]) -> Union[UploadFile, None]:
    """
    Given a list of files uploaded by a user, find the
    file that ends with `.csv` and return it. If no file
    is found, return None
    """
    for file in files:
        if file.filename.endswith(".csv"):
            return file
    return None


def parse_user_file_upload(files: List[UploadFile]) -> UploadFile:
    """
    Parse through files upload by a user and return the UploadFile object
    that should be used to instantiate a peppy.Project instance.

    ```mermaid
    graph TD;
      A[User uploads files] --> B{Included `.yaml` file?}
      B -- Yes --> C[Init project using `file.yaml`]
      B -- No --> D{Included `.csv` file?}
      D -- No --> E[Return `400`]
      D -- Yes --> F[Init project from `csv`]
    ```
    """
    yaml_file = find_yaml_file_in_file_list(files)
    if yaml_file is not None:
        return yaml_file
    else:
        csv_file = find_csv_file_in_file_list(files)
        if csv_file is not None:
            return csv_file
        else:
            raise HTTPException(
                status_code=400, detail="No .yaml or .csv file was found in the upload."
            )


def split_upload_files_on_init_file(
    all_files: List[UploadFile], init_file: UploadFile
) -> Tuple[UploadFile, List[UploadFile]]:
    """
    Given a list of files uploaded by a user and the file that should be used
    to init a peppy project, split the files into two objects, one being
    the init file and the other a list containing all other files.
    """
    other_files = [file for file in all_files if file.filename != init_file.filename]
    return init_file, other_files
