import axios from 'axios';
import { Project } from '../../types';

const API_BASE = import.meta.env.VITE_API_BASE;

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
