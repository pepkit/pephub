import axios from 'axios';
import { Project } from '../../types';

const API_BASE = import.meta.env.VITE_API_BASE;

export interface DeleteProjectResponse {
  message: string;
  registry: string;
}

export const getProject = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  token: string | null = null,
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}?tag=${tag}`;
  if (!token) {
    return axios.get<Project>(url).then((res) => res.data);
  } else {
    return axios.get<Project>(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data);
  }
};

export const getSampleTable = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  token: string | null = null,
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}/samples?tag=${tag}&format=csv`;
  if (!token) {
    return axios.get<string>(url).then((res) => res.data);
  } else {
    return axios.get<string>(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data);
  }
};

export const getProjectConfig = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  filter: string = 'yaml',
  token: string | null = null,
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}/convert?tag=${tag}&filter=${filter}`;
  if (!token) {
    return axios.get<string>(url).then((res) => res.data);
  } else {
    return axios.get<string>(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data);
  }
};

export const deleteProject = (namespace: string, projectName: string, tag: string = 'default', token: string) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}?tag=${tag}`;
  return axios.delete<DeleteProjectResponse>(url, { headers: { Authorization: `Bearer ${token}` } });
};
