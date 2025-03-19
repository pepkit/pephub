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
  namespace: string;
  name: string;
  description: string;
  maintainers: string;
  lifecycle_stage: string;
  private: boolean;
  last_update_date: string;
};

interface SchemaWithVersion {
  namespace: string;
  name: string;
  version: string;
  contributors: string;
  release_notes: string;
  tags: object;
  release_date: string;
  last_update_date: string;
}

interface GetSchemaVersionsResponse {
  pagination: {
    page: number;
    page_size: number;
    total: number;
  };
  results: SchemaWithVersion[];
}

type GetSchemaByVersionResponse = {};

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
  const url = `${API_BASE}/schemas/${namespace}/${name}?return_type=json`;
  const { data } = await axios.get<GetSchemaResponse>(url);
  return data;
};

export const getSchemaVersions = async (namespace: string, name: string, query: string, tag: string, page: number, page_size: number) => {
  const url = `${API_BASE}/schemas/${namespace}/${name}/versions?query=${query}&tag=${tag}&page=${page}&page_size${page_size}return_type=json`;
  const { data } = await axios.get<GetSchemaVersionsResponse>(url);
  return data;
};

export const getSchemaByVersion = async (namespace: string, name: string, version: string) => {
  const url = `${API_BASE}/schemas/${namespace}/${name}/versions/${version}?return_type=json`;
  const { data } = await axios.get<GetSchemaByVersionResponse>(url);
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
  schemaName: string,
  description: string,
  schemaValue: object,
  isPrivate: boolean,
  contributors: string[] | undefined,
  maintainers: string[] | undefined,
  tags: Record<string, string> | undefined,
  version: string | undefined,
  releaseNotes: string | undefined,
  lifecycleStage: string | undefined,
  jwt: string | null,
) => {
  const url = `${API_BASE}/schemas/${namespace}/json`;
  const { data } = await axios.post<CreateSchemaResponse>(
    url,
    { 
      namespace,
      schema_name: schemaName,
      description,
      schema_value: schemaValue,
      isPrivate,
      contributors: Array.isArray(contributors) ? contributors.join(',') : contributors || '',
      maintainers: Array.isArray(maintainers) ? maintainers.join(',') : maintainers || '',
      tags: tags,
      version: version || '1.0.0',
      release_notes: releaseNotes || '',
      lifecycle_stage: lifecycleStage || 'development',
    },
    { headers: { Authorization: `Bearer ${jwt || 'NOTAUTHORIZED'}` } },
  );
  return data;
};

export const createNewSchemaFiles = async (
  namespace: string,
  schemaName: string | undefined | null,
  description: string | undefined | null,
  schemaFile: File,
  isPrivate: boolean,
  contributors: string[] | undefined,
  maintainers: string[] | undefined,
  tags: Record<string, string> | undefined,
  version: string | undefined,
  releaseNotes: string | undefined,
  lifecycleStage: string | undefined,
  jwt: string | null,
) => {
  const url = `${API_BASE}/schemas/${namespace}/file`;
  
  const reader = new FileReader();
  const schemaValue = await new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(schemaFile);
  });

  const { data } = await axios.post<CreateSchemaResponse>(
    url, 
    {
      namespace,
      schema_value: JSON.parse(schemaValue),
      schema_name: schemaName || '',
      description: description || '',
      private: isPrivate,
      contributors: contributors ? contributors.join(',') : '',
      maintainers: maintainers ? maintainers.join(',') : '',
      tags: tags || [],
      version: version || '',
      release_notes: releaseNotes || '',
      lifecycle_stage: lifecycleStage || ''
    }, 
    { headers: { Authorization: `Bearer ${jwt || 'NOTAUTHORIZED'}` } },
  );
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
