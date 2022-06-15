from logging import getLogger
import peppy
import yaml
import os
from tqdm import tqdm
from .const import INFO_KEY, PKG_NAME

_LOGGER = getLogger(PKG_NAME)


def _is_valid_namespace(path: str, name: str) -> bool:
    """
    Check if a given path is a valid namespace directory. Function
    Will check a given path for the following criteria:
        1. Is a folder
        2. Is not a "dot" file (e.g. .git)
    """
    criteria = [os.path.isdir(path), not name.startswith(".")]
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
    criteria = [os.path.isdir(path), not name.startswith(".")]
    return all(criteria)

def _extract_namespace_info(path_to_namespace: str) -> dict:
    """
    Take a given path to a namespace and attempt to extract any
    info found. It attempts to find a .pep.yaml file and returns
    the contents of the file as a dict.

    :param str path_to_namespace - path to the namespace to look
    :return dict - dictionary of info
    """
    try:
        with open(f"{path_to_namespace}/.pep.yaml", 'r') as stream:
            _pephub_yaml = yaml.safe_load(stream)
        return _pephub_yaml
    except FileNotFoundError:
        return {}


def _extract_project_file_name(path_to_proj: str) -> str:
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
    """
    try:
        with open(f"{path_to_proj}/.pep.yaml", "r") as stream:
            _pephub_yaml = yaml.safe_load(stream)

        # check for config_file attribute
        if "config_file" in _pephub_yaml:
            # check that the config file exists
            if not os.path.exists(f"{path_to_proj}/{_pephub_yaml['config_file']}"):
                _LOGGER.warn(
                    f"Specified pep config file '{_pephub_yaml['config_file']}'\
                    not found in directory, '{path_to_proj}'. This pep will be unloadable by pephub. "
                )
        return _pephub_yaml["config_file"]

    # catch no .pep.yaml exists
    except FileNotFoundError:
        if not os.path.exists(f"{path_to_proj}/project_config.yaml"):
            _LOGGER.warn(
                f"No project config file found for {path_to_proj}.\
                This project will not be accessible by pephub. "
            )
        return "project_config.yaml"


def load_data_tree(path: str, data_store: dict) -> None:
    """
    Load the storage tree into memory by traversing
    the folder structure and storing locations to
    configuration files into the dictonary
    """
    _LOGGER.info(f"Indexing PEPs in {path}")

    # traverse directory
    for name in tqdm(os.listdir(path), desc='Progress', position=0):
        # build a path to the namespace
        path_to_namespace = f"{path}/{name}"
        name = name.lower()

        if _is_valid_namespace(path_to_namespace, name):
            # init sub-dict
            data_store[name] = {}
            data_store[name][INFO_KEY] = _extract_namespace_info(path_to_namespace)

            # traverse projects
            for proj in tqdm(os.listdir(path_to_namespace), desc=f"{name}", position=1, leave=False):
                # build path to project
                path_to_proj = f"{path_to_namespace}/{proj}"
                if _is_valid_project(path_to_proj, proj):
                    # populate project data
                    # store path to config
                    data_store[name][
                        proj.lower()
                    ] = {
                        'name': proj,
                        'cfg_path': f"{path_to_proj}/{_extract_project_file_name(path_to_proj)}"
                    }

                    # store number of samples in project by loading project into memory
                    p = peppy.Project(data_store[name][proj.lower()]['cfg_path'])
                    data_store[name][proj.lower()]['n_samples'] = len(p.samples)

                    # store href
                    data_store[name][proj.lower()]['href'] = f"/pep/{name}/{proj.lower()}"

    return data_store
