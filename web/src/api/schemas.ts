import axios from 'axios';

import { constructQueryFromPaginationParams } from '../utils/etc';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

export type Schema = {
  namespace: string;
  name: string;
  last_update_date: string;
  submission_date: string;
  description: string;
};

type PaginationParams = {
  offset?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
};

type GetSchemasResponse = {
  count: number;
  limit: number;
  offset: number;
  results: Schema[];
};

type GetSchemaResponse = {
  schema: string;
};

type CreateSchemaResponse = {
  message: string;
};

type DeleteSchemaResponse = {
  message: string;
};

export const getSchemas = async (params: PaginationParams) => {
  const query = constructQueryFromPaginationParams(params);
  const url = `${API_BASE}/schemas?${query.toString()}`;
  const { data } = await axios.get<GetSchemasResponse>(url);
  return data;
};

export const getSchema = async (namespace: string, name: string) => {
  const url = `${API_BASE}/schemas/${namespace}/${name}`;
  const { data } = await axios.get<GetSchemaResponse>(url);
  return data;
};

export const createNewSchema = async (
  namespace: string,
  name: string,
  description: string,
  isPrivate: boolean,
  schema: string,
  jwt: string | null,
) => {
  const url = `${API_BASE}/schemas/${namespace}`;
  const { data } = await axios.post<CreateSchemaResponse>(
    url,
    { namespace: namespace, name, description, schema },
    { headers: { Authorization: `Bearer ${jwt || 'NOTAUTHORIZED'}` } },
  );
  return data;
};

export const deleteSchema = async (namespace: string, name: string, jwt: string | null) => {
  const url = `${API_BASE}/schemas/${namespace}/${name}`;
  const { data } = await axios.delete<CreateSchemaResponse>(url, {
    headers: { Authorization: `Bearer ${jwt || 'NOTAUTHORIZED'}` },
  });
  return data;
};
