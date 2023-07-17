import axios from 'axios';
import YAML from 'yaml';

import { BiggestNamespaceResults, Project, ProjectAnnotation, Sample } from '../../types';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

export interface NamespaceResponse {
  namespace: string;
  number_of_projects: number;
  number_of_samples: number;
  projects_endpoint: string;
}

export interface NamespaceProjectsResponse {
  count: number;
  offset: number;
  limit: number;
  items: ProjectAnnotation[];
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

export const getNamespaceInfo = (namespace: string, token: string | null = null) => {
  const url = `${API_BASE}/namespaces/${namespace}/`; // note the trailing slash
  if (!token) {
    return axios.get<NamespaceResponse>(url).then((res) => res.data);
  } else {
    return axios.get<NamespaceResponse>(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data);
  }
};

export const getBiggestNamespaces = (limit: number) => {
  const url = `${API_BASE}/namespace/info?limit=${limit}`; // note the trailing slash
  return axios.get<BiggestNamespaces>(url).then((res) => res.data);
};

export const getNamespaceProjects = (
  namespace: string,
  token: string | null = null,
  { search, offset, limit, orderBy, order }: PaginationParams,
) => {
  // construct query based on search, offset, and limit
  const query = new URLSearchParams();
  if (search) {
    query.set('q', search);
  }
  if (offset) {
    query.set('offset', offset.toString());
  }
  if (limit) {
    query.set('limit', limit.toString());
  }
  if (orderBy) {
    query.set('order_by', orderBy);
  }
  if (order) {
    if (order === 'asc') {
      query.set('order_desc', 'false');
    } else {
      query.set('order_desc', 'true');
    }
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
          pep_schema: pep_schema,
        },
        description: description || '',
        name: name,
        is_private: is_private || false,
        tag: tag || 'default',
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
