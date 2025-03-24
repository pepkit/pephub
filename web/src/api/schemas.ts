import axios from 'axios';

import { constructQueryFromPaginationParams } from '../utils/etc';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

// export type Schema = {
//   namespace: string;
//   name: string;
//   last_update_date: string;
//   submission_date: string;
//   description: string | undefined;
// };

type PaginationParams = {
  offset?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
};

export interface Schema {
  namespace: string;
  name: string;
  description: string | undefined;
  maintainers: string;
  lifecycle_stage: string;
  latest_version: string;
  private: boolean;
  last_update_date: string;
}

interface Pagination {
  page: number;
  page_size: number;
  total: number;
}

type GetSchemasResponse = {
  pagination: Pagination;
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
  maintainers?: string;
  lifecycleStage?: string;
  name?: string;
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
  contributors: string | undefined,
  maintainers: string | undefined,
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
      contributors: contributors || '',
      maintainers: maintainers || '',
      tags: tags,
      version: version || '0.1.0',
      release_notes: releaseNotes || '',
      lifecycle_stage: lifecycleStage || '',
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
  contributors: string | undefined,
  maintainers: string | undefined,
  tags: Record<string, string> | undefined,
  version: string | undefined,
  releaseNotes: string | undefined,
  lifecycleStage: string | undefined,
  jwt: string | null,
) => {
  const url = `${API_BASE}/schemas/${namespace}/files`;
  
  // Create FormData object for file upload
  const formData = new FormData();
  formData.append('namespace', namespace);
  formData.append('schema_name', schemaName || '');
  formData.append('description', description || '');
  formData.append('private', isPrivate.toString());
  formData.append('contributors', contributors || '');
  formData.append('maintainers', maintainers || '');
  formData.append('tags', tags ? JSON.stringify(tags) : '{}');
  formData.append('version', version || '');
  formData.append('release_notes', releaseNotes || '');
  formData.append('lifecycle_stage', lifecycleStage || '');
  
  // Append the file with the correct field name expected by your backend
  formData.append('schema_file', schemaFile);
  
  // Send FormData with proper headers for multipart/form-data
  const { data } = await axios.post<CreateSchemaResponse>(
    url, 
    formData,
    { 
      headers: { 
        'Authorization': `Bearer ${jwt || 'NOTAUTHORIZED'}`,
        'Content-Type': 'multipart/form-data'  // Let Axios set the correct boundary
      } 
    },
  );
  return data;
};

export const deleteSchema = async (namespace: string, name: string, jwt: string | null) => {
  const url = `${API_BASE}/schemas/${namespace}/${name}`;
  const { data } = await axios.delete<DeleteSchemaResponse>(url, {
    headers: { Authorization: `Bearer ${jwt || 'NOTAUTHORIZED'}` },
    params: {
      schema: name
    }
  });
  return data;
};

export const updateSchema = async (
  namespace: string,
  name: string,
  jwt: string | null,
  maintainers?: string,
  lifecycleStage?: string,
  description?: string,
  isPrivate?: boolean,
) => {
  const url = `${API_BASE}/schemas/${namespace}/${name}`;
  const { data } = await axios.patch<UpdateSchemaResponse>(url, {
    namespace,
    name,
    description: description || '',
    private: isPrivate,
    maintainers: maintainers || '',
    lifecycle_stage: lifecycleStage || ''
  }, {
    headers: { Authorization: `Bearer ${jwt || 'NOTAUTHORIZED'}` },
  });
  return data;
};

export const createSchemaVersion = async (
  namespace: string,
  schemaName: string,
  schemaValue: object,
  contributors: string | undefined,
  tags: Record<string, string> | undefined,
  version: string | undefined,
  releaseNotes: string | undefined,
  jwt: string | null,
) => {
  const url = `${API_BASE}/schemas/${namespace}/${schemaName}/versions/json`;
  const { data } = await axios.post<CreateSchemaResponse>(
    url,
    { 
      namespace,
      schema_name: schemaName,
      schema_value: schemaValue,
      contributors: contributors,
      tags: tags,
      version: version || '1.0.0',
      release_notes: releaseNotes || '',
    },
    { headers: { Authorization: `Bearer ${jwt || 'NOTAUTHORIZED'}` } },
  );
  return data;
};
