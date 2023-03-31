import { ProjectAnnotation, Project } from '../../types';
import { mutate } from 'swr';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE;

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

export const submitProject = (
  {
    namespace,
    name,
    tag,
    is_private,
    description,
  }: {
    namespace: string;
    name: string;
    tag?: string;
    is_private?: boolean;
    description?: string;
  },
  token: string,
) => {
  const url = `${API_BASE}/namespaces/${namespace}/projects`;
  return axios
    .post<ProjectSubmissionResponse>(
      url,
      {
        project_name: name,
        tag: tag || 'default',
        is_private: is_private || false,
        description: description || '',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    .then((res) => {
      mutate(`${namespace}-projects`);
      return res.data;
    });
};
