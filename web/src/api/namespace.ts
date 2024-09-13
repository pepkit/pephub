import axios from 'axios';
import YAML from 'yaml';

import { BiggestNamespaceResults, Project, ProjectAnnotation, Sample } from '../../types';
import { constructQueryFromPaginationParams } from '../utils/etc';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

export interface NamespaceResponse {
  namespace: string;
  number_of_projects: number;
  number_of_samples: number;
}

export interface NamespaceProjectsResponse {
  count: number;
  offset: number;
  limit: number;
  results: ProjectAnnotation[];
}

export interface PaginationParams {
  offset?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface ProjectSubmissionResponse {
  namespace: string;
  name: string;
  proj: Project;
  init_file: string;
  tag: string;
  registry_path: string;
  msg?: string;
}

export interface BiggestNamespaces {
  number_of_namespaces: number;
  limit: number;
  results: BiggestNamespaceResults[];
}

interface NamespaceSearchResponse {
  results: NamespaceResponse[];
  count: number;
  limit: number;
  offset: number;
}

export interface StarsResponse {
  count: number;
  limit: number;
  offset: number;
  results: ProjectAnnotation[];
}

interface AddStarResponse {
  namespace: string;
  registry_path: string;
  message: string;
}

interface RemoveStarResponse {
  message: string;
  registry: string;
  namespace: string;
}

type DeleteAllPepsResponse = {
  message: string;
};

export interface ArchiveItem {
  identifier: number;
  namespace: string;
  file_path: string;
  creation_date: string; // ISO 8601 date string
  number_of_projects: number;
  file_size: number;
}

export interface ArchiveResponse {
  count: number;
  results: ArchiveItem[];
}

export const getNamespaceInfo = (namespace: string, token: string | null = null) => {
  const url = `${API_BASE}/namespaces/${namespace}/`; // note the trailing slash
  if (!token) {
    return axios.get<NamespaceResponse>(url).then((res) => res.data);
  } else {
    return axios.get<NamespaceResponse>(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data);
  }
};

export const getBiggestNamespaces = (limit: number) => {
  const url = `${API_BASE}/namespaces/info?limit=${limit}`; // note the trailing slash
  return axios.get<BiggestNamespaces>(url).then((res) => res.data);
};

export const getNamespaceProjects = (
  namespace: string,
  token: string | null = null,
  { search, offset, limit, orderBy, order }: PaginationParams,
  type?: 'pep' | 'pop',
) => {
  const query = constructQueryFromPaginationParams({ search, offset, limit, orderBy, order });
  if (type) {
    query.append('pep_type', type);
  }
  const url = `${API_BASE}/namespaces/${namespace}/projects?${query.toString()}`;
  if (!token) {
    return axios.get<NamespaceProjectsResponse>(url).then((res) => res.data);
  } else {
    return axios
      .get<NamespaceProjectsResponse>(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data);
  }
};

export const getNamespaceStars = (
  namespace: string,
  token: string | null = null,
  { search, offset, limit, orderBy, order }: PaginationParams,
) => {
  const query = constructQueryFromPaginationParams({ search, offset, limit, orderBy, order });
  const url = `${API_BASE}/namespaces/${namespace}/stars?${query.toString()}`;
  if (!token) {
    return axios
      .get<StarsResponse>(url)
      .then((res) => res.data)
      .then((data) => data.results);
  } else {
    return axios
      .get<StarsResponse>(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data)
      .then((data) => data.results);
  }
};

export const submitProjectFiles = (
  {
    namespace,
    name,
    tag,
    is_private,
    description,
    files,
    pep_schema,
  }: {
    namespace: string;
    name: string;
    tag?: string;
    is_private?: boolean;
    description?: string;
    files: FileList;
    pep_schema: string;
  },
  token: string,
) => {
  const url = `${API_BASE}/namespaces/${namespace}/projects/files`;

  // construct form data
  const formData = new FormData();
  formData.append('name', name);
  formData.append('tag', tag || 'default');
  formData.append('is_private', is_private?.toString() || 'false');
  formData.append('description', description || '');
  formData.append('pep_schema', pep_schema);

  // attach files
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }

  return axios
    .post<ProjectSubmissionResponse>(url, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((res) => {
      return res.data;
    });
};

export const submitProjectJSON = (
  {
    namespace,
    name,
    tag,
    is_private,
    description,
    config,
    pep_schema,
    sample_table,
  }: {
    namespace: string;
    name: string;
    tag?: string;
    is_private?: boolean;
    description?: string;
    sample_table: Sample[];
    config: string;
    pep_schema: string;
  },
  token: string,
) => {
  const url = `${API_BASE}/namespaces/${namespace}/projects/json`;

  const config_json = YAML.parse(config);
  return axios
    .post<ProjectSubmissionResponse>(
      url,
      {
        pep_dict: {
          config: config_json,
          sample_list: sample_table,
        },
        description: description || '',
        name: name,
        is_private: is_private || false,
        tag: tag || 'default',
        pep_schema: pep_schema,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )
    .then((res) => {
      return res;
    });
};

export const submitPop = (
  {
    namespace,
    name,
    tag,
    is_private,
    description,
    pep_schema,
    peps,
  }: {
    namespace: string;
    name: string;
    tag?: string;
    is_private?: boolean;
    description?: string;
    peps: Sample[];
    pep_schema: string;
  },
  token: string,
) => {
  const url = `${API_BASE}/namespaces/${namespace}/projects/json`;

  const config_json = YAML.parse('pep_version: 2.1.0');

  return axios
    .post<ProjectSubmissionResponse>(
      url,
      {
        pep_dict: {
          config: config_json,
          sample_list: peps,
          pep_schema: pep_schema,
        },
        description: description || '',
        name: name,
        is_private: is_private || false,
        tag: tag || 'default',
        pop: true,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )
    .then((res) => {
      return res;
    });
};

export const starProject = (
  namespace: string,
  star_namespace: string,
  star_project: string,
  star_tag: string,
  token: string,
) => {
  const url = `${API_BASE}/namespaces/${namespace}/stars`;
  return axios
    .post<AddStarResponse>(
      url,
      {
        namespace: star_namespace,
        name: star_project,
        tag: star_tag,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )
    .then((res) => {
      return res;
    });
};

export const removeStar = (
  namespace: string,
  star_namespace: string,
  star_project: string,
  star_tag: string,
  token: string,
) => {
  const url = `${API_BASE}/namespaces/${namespace}/stars`;
  return axios
    .delete<RemoveStarResponse>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        namespace: star_namespace,
        name: star_project,
        tag: star_tag,
      },
    })
    .then((res) => {
      return res;
    });
};

export const getAllNamespaces = (search?: string, limit?: number, offset?: number) => {
  const query = constructQueryFromPaginationParams({ search, limit, offset });
  const url = `${API_BASE}/search/namespaces?${query.toString()}`;
  return axios.get<NamespaceSearchResponse>(url).then((res) => res.data);
};

export const deleteAllPepsFromNamespace = (namespace: string, token: string | null) => {
  const url = `${API_BASE}/namespaces/${namespace}`;
  return axios.delete<DeleteAllPepsResponse>(url, {
    headers: {
      Authorization: `Bearer ${token || 'NOTAUTHORIZED'}`,
    },
  });
};

export const getNamespaceArchive = (namespace: string) => {
  const url = `${API_BASE}/namespaces/${namespace}/archive`;
  return axios.get<ArchiveResponse>(url).then((res) => res.data);
};

export const getStandardizerSchemas = (namespace: string) => {
  const url = `${API_BASE}/namespaces/${namespace}/standardizer_schemas`;
  return axios.get<string[]>(url).then((res) => res.data);
};

