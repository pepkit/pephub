from logging import getLogger
from typing import List, Union
import peppy
import yaml
import os
import pathlib
from itertools import chain
from attmap import PathExAttMap
from tqdm import tqdm
from .const import INDEX_STORE_KEY, INFO_KEY, N_PROJECTS_KEY, N_SAMPLES_KEY, PKG_NAME, PROJECTS_KEY
from .exceptions import NamespaceNotFoundError

_LOGGER = getLogger(PKG_NAME)

class PEPIndexer(PathExAttMap):
    """Class to parse a pephub repository and preoduce an index file."""

    def __init__(self):
        self[INDEX_STORE_KEY] = None

    def _is_valid_namespace(self, path: str) -> bool:
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

    def _is_valid_project(self, path: str) -> bool:
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

    def _extract_namespace_info(self, path_to_namespace: str) -> dict:
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

    def _extract_project_file_name(self, path_to_proj: str) -> str:
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

    def index(self, path: str, output: str = "index.yaml", reset=False) -> None:
        """
        Load the storage tree into memory by traversing
        the folder structure and storing locations to
        configuration files into the dictonary.

        :param str path - path to repository
        :param str output - path to the output file of the index
        :param boolean reset - flag to reset the index if one has already been created
        """
        # check path exists ... make if not
        if not os.path.exists(output):
            filepath = pathlib.Path(output)
            filepath.parent.mkdir(parents=True, exist_ok=True)

        # init datastore dict if it doesn't already exist
        if any([self[INDEX_STORE_KEY] is None, reset]):
            self[INDEX_STORE_KEY] = {}

        # traverse directory
        for name in tqdm(os.listdir(path), desc="Indexing repository", leave=True):
            # build a path to the namespace
            path_to_namespace = f"{path}/{name}"
            name = name.lower()

            if self._is_valid_namespace(path_to_namespace):
                # init sub-dict
                self[INDEX_STORE_KEY][name] = {PROJECTS_KEY: {}}

                # populate info
                self[INDEX_STORE_KEY][name][INFO_KEY] = self._extract_namespace_info(
                    path_to_namespace
                )

                # traverse projects
                for proj in tqdm(
                    os.listdir(path_to_namespace), desc=f"Indexing {name}", leave=True
                ):
                    # build path to project
                    path_to_proj = f"{path_to_namespace}/{proj}"
                    proj = proj.lower()
                    if self._is_valid_project(path_to_proj):
                        # init project
                        self[INDEX_STORE_KEY][name][PROJECTS_KEY][proj] = {
                            "name": proj,
                            "cfg": f"{path_to_proj}/{self._extract_project_file_name(path_to_proj)}",
                        }
                        self[INDEX_STORE_KEY][name][PROJECTS_KEY][proj][INFO_KEY] = {}

                        # store number of samples in project by loading project into memory
                        p = peppy.Project(self[INDEX_STORE_KEY][name][PROJECTS_KEY][proj]["cfg"])

                        self[INDEX_STORE_KEY][name][PROJECTS_KEY][proj][INFO_KEY][N_SAMPLES_KEY] = len(p.samples)
                
                self[INDEX_STORE_KEY][name][INFO_KEY][N_PROJECTS_KEY] = len(
                    self[INDEX_STORE_KEY][name][PROJECTS_KEY]
                )
                self[INDEX_STORE_KEY][name][INFO_KEY][N_SAMPLES_KEY] = sum(
                    self[INDEX_STORE_KEY][name][PROJECTS_KEY][p][INFO_KEY][N_SAMPLES_KEY] for p in self[INDEX_STORE_KEY][name][PROJECTS_KEY]
                )

        # dump to yaml
        with open(output, "w") as fh:
            yaml.dump(self[INDEX_STORE_KEY].to_dict(), fh)

        return self[INDEX_STORE_KEY]
    
    def get_namespace(self, namespace: str) -> dict:
        """
        Get a particular namespace's info/meta-data

        :param str namespace - the desited namespace
        """
        if namespace not in self[INDEX_STORE_KEY]:
            return None
        else:
            return {
                'name': namespace,
                'projects': self.get_projects(namespace),
                'info': self[INDEX_STORE_KEY][namespace][INFO_KEY]
            }
    
    def get_namespaces(self, names_only=False) -> List[Union[str, dict]]:
        """
        Return a list of namespace names in the index

        :param boolean names_only - a flag to indicate the user only wants the
                                    names of the namespaces (i.e. no meta data)
        """
        nspaces = [n for n in self[INDEX_STORE_KEY] if n is not INFO_KEY]
        if names_only:
            return nspaces
        else:
            return [{
                'name': n,
                'info': self[INDEX_STORE_KEY][n][INFO_KEY]
            } for n in nspaces]
    
    def get_project(self, namespace: str, project: str) -> dict:
        """
        Return a dict of a specific PEP's data

        :param str namespace - namespace where the project lives
        :param str project - name of the project to get
        """
        if project not in self[INDEX_STORE_KEY][namespace][PROJECTS_KEY]:
            return None
        else:
            return {
                'name': project,
                'namespace': namespace,
                'cfg': self[INDEX_STORE_KEY][namespace][PROJECTS_KEY][project]['cfg'],
                'project': self[INDEX_STORE_KEY][namespace][PROJECTS_KEY][project],
                'info': self[INDEX_STORE_KEY][namespace][PROJECTS_KEY][project][INFO_KEY]
            }
    
    def get_projects(self, namespace: str = None) -> List[dict]:
        """
        Return a list of project representations (dicts). Can either
        return for specific namespace or all projects in the index.

        :param str namespace - namespace to get projects for (Optional.)
        """
        if namespace is not None:
            if namespace not in self[INDEX_STORE_KEY]:
                raise NamespaceNotFoundError(
                    f"Namespace '{namespace}' not found in index."
                )
            return self[INDEX_STORE_KEY][namespace][PROJECTS_KEY]
        else:
            return list(
                chain(
                    *[
                        self[INDEX_STORE_KEY][n][PROJECTS_KEY]
                        for n in self[INDEX_STORE_KEY]
                        if n is not INFO_KEY
                    ]
                )
            )

    def get_index(self) -> dict:
        """Return dict representation of the index"""
        return dict(self[INDEX_STORE_KEY])

    def load_index(self, path: str):
        """
        Load a previously created index file.

        :param str path - path to the file.
        """
        with open(path, "r") as fh:
            self[INDEX_STORE_KEY] = yaml.safe_load(fh)