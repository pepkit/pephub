import os
import yaml
import pathlib

def is_valid_namespace(path: str) -> bool:
    """
    Check if a given path is a valid namespace directory. Function
    Will check a given path for the following criteria:
        1. Is a folder
        2. Is not a "dot" file (e.g. .git)

    :param str path - path to potential namespace
    """
    name = pathlib.Path(path).name
    criteria = [os.path.isdir(path), not name.startswith(".")]
    return all(criteria)

def is_valid_project(path: str) -> bool:
    """
    Check if a given project name is a valid project
    directory. Will check a given project for the following
    criteria:
        1. Is a folder
        2. Is not a "dot" file (e.g. .git)

    :param str path - path potential project
    """
    name = pathlib.Path(path).name
    criteria = [os.path.isdir(path), not name.startswith(".")]
    return all(criteria)

def extract_namespace_info(path_to_namespace: str) -> dict:
    """
    Take a given path to a namespace and attempt to extract any
    info found. It attempts to find a .pep.yaml file and returns
    the contents of the file as a dict.

    :param str path_to_namespace - path to the namespace to look
    :return dict - dictionary of info
    """
    try:
        with open(f"{path_to_namespace}/.pep.yaml", "r") as stream:
            _pephub_yaml = yaml.safe_load(stream)
        return _pephub_yaml
    except FileNotFoundError:
        return {}

def extract_project_file_name(path_to_proj: str) -> str:
    """
    Take a given path to a PEP/project inside a namespace and
    return the name of the PEP configuration file. The process
    is completed in the following steps:
        1. Look for a .pep.yaml file
            if exists -> check for config_file attribute
            else step two
        2. Look for project_config.yaml
            if exists -> return path
            else step 3
        3. If no .pep.yaml file with config_file attribute exists AND
        no porject_config.yaml file exists, then return None.

    :param str path_to_proj - path to the project
    """
    try:
        with open(f"{path_to_proj}/.pep.yaml", "r") as stream:
            _pephub_yaml = yaml.safe_load(stream)

        # check for config_file attribute
        if "config_file" in _pephub_yaml:
            # check that the config file exists
            if not os.path.exists(f"{path_to_proj}/{_pephub_yaml['config_file']}"):
                print(
                    f"Specified pep config file '{_pephub_yaml['config_file']}'\
                    not found in directory, '{path_to_proj}'. This pep will be unloadable by pephub. "
                )
        return _pephub_yaml["config_file"]

    # catch no .pep.yaml exists
    except FileNotFoundError:
        if not os.path.exists(f"{path_to_proj}/project_config.yaml"):
            print(
                f"No project config file found for {path_to_proj}.\
                This project will not be accessible by pephub. "
            )
        return "project_config.yaml"