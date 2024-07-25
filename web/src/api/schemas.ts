import axios from 'axios';

import { constructQueryFromPaginationParams } from '../utils/etc';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

export type Schema = {
  namespace: string;
  name: string;
  last_update_date: string;
  submission_date: string;
  description: string | undefined;
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
  description: string;
  // private: boolean;
  last_update_date: string;
  submission_date: string;
};

type CreateSchemaResponse = {
  message: string;
};

type DeleteSchemaResponse = {
  message: string;
};

type UpdateSchemaResponse = {
  message: string;
};

type UpdateSchemaPayload = {
  schema?: string;
  description?: string;
  isPrivate?: boolean;
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

export const getNamespaceSchemas = async (namespace: string, params: PaginationParams) => {
  const query = constructQueryFromPaginationParams(params);
  const url = `${API_BASE}/schemas/${namespace}?${query.toString()}`;
  const { data } = await axios.get<GetSchemasResponse>(url);
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
  const url = `${API_BASE}/schemas/${namespace}/json`;
  const { data } = await axios.post<CreateSchemaResponse>(
    url,
    { namespace: namespace, name, description, schema },
    { headers: { Authorization: `Bearer ${jwt || 'NOTAUTHORIZED'}` } },
  );
  return data;
};

export const createNewSchemaFiles = async (
  namespace: string,
  name: string | undefined | null,
  description: string | undefined | null,
  isPrivate: boolean,
  schema: File,
  jwt: string | null,
) => {
  const url = `${API_BASE}/schemas/${namespace}/file`;
  const formData = new FormData();
  formData.append('namespace', namespace);
  formData.append('schema_file', schema);
  name && formData.append('name', name);
  description && formData.append('description', description);

  const { data } = await axios.post<CreateSchemaResponse>(url, formData, {
    headers: { Authorization: `Bearer ${jwt || 'NOTAUTHORIZED'}`, 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteSchema = async (namespace: string, name: string, jwt: string | null) => {
  const url = `${API_BASE}/schemas/${namespace}/${name}`;
  const { data } = await axios.delete<DeleteSchemaResponse>(url, {
    headers: { Authorization: `Bearer ${jwt || 'NOTAUTHORIZED'}` },
  });
  return data;
};

export const updateSchema = async (
  namespace: string,
  name: string,
  updatedSchema: UpdateSchemaPayload,
  jwt: string | null,
) => {
  const url = `${API_BASE}/schemas/${namespace}/${name}`;
  const { data } = await axios.patch<UpdateSchemaResponse>(url, updatedSchema, {
    headers: { Authorization: `Bearer ${jwt || 'NOTAUTHORIZED'}` },
  });
  return data;
};
