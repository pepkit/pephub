import { ProjectAnnotation, Project } from '../../types';
import axios from 'axios';

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
}

export interface ProjectSubmissionResponse {
  namespace: string;
  project_name: string;
  proj: Project;
  init_file: string;
  tag: string;
  registry_path: string;
  msg?: string;
}

export const getNamespaceInfo = (namespace: string, token: string | null = null) => {
  const url = `${API_BASE}/namespaces/${namespace}/`; // note the trailing slash
  if (!token) {
    return axios.get<NamespaceResponse>(url).then((res) => res.data);
  } else {
    return axios.get<NamespaceResponse>(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data);
  }
};

export const getNamespaceProjects = (
  namespace: string,
  token: string | null = null,
  { search, offset, limit }: PaginationParams,
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
    project_name,
    tag,
    is_private,
    description,
    files,
  }: {
    namespace: string;
    project_name: string;
    tag?: string;
    is_private?: boolean;
    description?: string;
    files: FileList;
  },
  token: string,
) => {
  const url = `${API_BASE}/namespaces/${namespace}/projects/files`;

  // construct form data
  const formData = new FormData();
  formData.append('project_name', project_name);
  formData.append('tag', tag || 'default');
  formData.append('is_private', is_private?.toString() || 'false');
  formData.append('description', description || '');

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
    project_name,
    tag,
    is_private,
    description,
    config,
  }: {
    namespace: string;
    project_name: string;
    tag?: string;
    is_private?: boolean;
    description?: string;
    sample_table: string;
    config: string;
  },
  token: string,
) => {
  const url = `${API_BASE}/namespaces/${namespace}/projects/json`;
  return axios
    .post<ProjectSubmissionResponse>(
      url,
      {
        pep_dict: {
          name: project_name,
          description: description || '',
          config: config,
        },
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
