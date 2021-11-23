import yaml
import os

def _is_valid_namespace(path: str, name: str) -> bool:
    """
    Check if a given path is a valid namespace directory. Function
    Will check a given path for the following criteria:
        1. Is a folder
        2. Is not a "dot" file (e.g. .git)
    """
    criteria = [
        os.path.isdir(path),
        not name.startswith(".")
    ]
    return all(criteria)

# attentive programmers will notice that this is identical
# to the function above. I am keeping them separate as in
# the future there might exist separate criteria for a
# namespace v a projects
def _is_valid_project(path: str, name: str) -> bool:
    """
    Check if a given project name is a valid project
    directory. Will check a given project for the following
    criteria:
        1. Is a folder
        2. Is not a "dot" file (e.g. .git)
    """
    criteria = [
        os.path.isdir(path),
        not name.startswith(".")
    ]
    return all(criteria)

def _extract_project_file_name(path_to_proj: str) -> str:
    """
    Take a given path to a PEP/project inside a namespace and
    return the name of the PEP configuration file. The process
    is completed in the following steps:
        1. Look for a .pephub.yaml file
            if exists -> check for config_file attribute
            else step two
        2. Look for project_config.yaml
            if exists -> return path
            else step 3
        3. If no .pephub.yaml file with config_file attribute exists AND
           no porject_config.yaml file exists, then return None.
    """
    try:
        with open(f"{path_to_proj}/.pephub.yaml", "r") as stream:
            _pephub_yaml = yaml.safe_load(stream)

        # check for config_file attribute
        if "config_file" in _pephub_yaml: return _pephub_yaml["config_file"]
        else: return None

    # catch no .pephub.yaml exists
    except FileNotFoundError:
        if not os.path.exists(f"{path_to_proj}/project_config.yaml"):
            return None
        else: return "project_config.yaml"

def load_data_tree(path: str, data_store: dict) -> None:
    """
    Load the storage tree into memory by traversing
    the folder structure and storing locations to
    configuration files into the dictonary
    """
    
    # traverse directory
    for name in os.listdir(path):
        # build a path to the namespace
        path_to_namespace = f"{path}/{name}"
        if _is_valid_namespace(path_to_namespace, name):
            # init sub-dict
            data_store[name] = {}

            # traverse projects
            for proj in os.listdir(path_to_namespace):
                # build path to project
                path_to_proj = f"{path_to_namespace}/{proj}"
                if _is_valid_project(path_to_proj, proj):
                    data_store[name][proj] = f"{path_to_proj}/{_extract_project_file_name(path_to_proj)}"

    return data_store