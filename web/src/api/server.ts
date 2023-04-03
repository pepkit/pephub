import axios from 'axios';

export interface ApiBase {
  pephub_version: string;
  peppy_version: string;
  python_version: string;
  fastapi_version: string;
  pepdbagent_version: string;
  api_version: number;
  message: string;
}

const API_BASE = import.meta.env.VITE_API_BASE;

export const getApiBase = () => {
  const url = `${API_BASE}/`;
  return axios.get<ApiBase>(url).then((res) => res.data);
};
