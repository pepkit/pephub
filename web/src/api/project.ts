import axios from 'axios';

import {
  Project,
  ProjectAllHistory,
  ProjectAnnotation,
  ProjectConfigResponse,
  ProjectHistory,
  ProjectViewAnnotation,
  Sample,
} from '../../types';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

type ProjectUpdateItems = {
  project_value?: Project | null;
  tag?: string | null;
  is_private?: boolean | null;
  name?: string | null;
  pep_schema?: string | null;
};

type ProjectUpdateMetadata = ProjectUpdateItems & {
  sample_table?: Sample[] | null;
  project_config_yaml?: string | null;
  description?: string | null;
  subsample_list?: string[] | null;
};
export type SampleTableResponse = {
  count: number;
  items: Sample[];
};

export type DeleteProjectResponse = {
  message: string;
  registry: string;
};

export type MultiProjectResponse = {
  count: number;
  results: ProjectAnnotation[];
  offset: number;
  limit: number;
};

export type ProjectViewsResponse = {
  namespace: string;
  project: string;
  tag: string;
  views: ProjectViewAnnotation[];
};

export type CreateProjectViewRequest = {
  description?: string;
  viewName: string;
  sampleNames: string[];
  noFail?: boolean;
};

export type CreateProjectViewResponse = {
  message: string;
  registry: string;
};

export type DeleteProjectViewResponse = {
  message: string;
  registry: string;
};

export type ProjectAllHistoryResponse = {
  namespace: string;
  name: string;
  tag: string;
  history: ProjectAllHistory[];
};

export type DeleteProjectHistoryResponse = {
  message: string;
  registry: string;
};

export type RestoreProjectFromHistoryResponse = {
  message: string;
  registry: string;
};

export type StandardizeColsResponse = {
  results: {
    [key: string]: {
      [key: string]: number;
    };
  };
};

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

export const getProjectAnnotation = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  token: string | null = null,
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}/annotation?tag=${tag}`;
  if (!token) {
    return axios.get<ProjectAnnotation>(url).then((res) => res.data);
  } else {
    return axios.get<ProjectAnnotation>(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data);
  }
};

export const getMultiProjectAnnotation = (registry_paths: string[], token: string | null = null) => {
  const param = registry_paths.join(',');
  const url = `${API_BASE}/projects?registry_paths=${param}`;
  if (!token) {
    return axios.get<MultiProjectResponse>(url).then((res) => res.data);
  } else {
    return axios
      .get<MultiProjectResponse>(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data);
  }
};

export const getSampleTable = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  token: string | null = null,
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}/samples?tag=${tag}&raw=true&with_id=true`;
  if (!token) {
    return axios.get<SampleTableResponse>(url).then((res) => res.data);
  } else {
    return axios
      .get<SampleTableResponse>(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data);
  }
};

export const getSubsampleTable = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  token: string | null = null,
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}/subsamples?tag=${tag}&raw=true`;
  if (!token) {
    return axios.get<SampleTableResponse>(url).then((res) => res.data);
  } else {
    return axios
      .get<SampleTableResponse>(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data);
  }
};

export const getProjectConfig = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  token: string | null = null,
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}/config?tag=${tag}&raw=true&format=String`;
  if (!token) {
    return axios.get<ProjectConfigResponse>(url).then((res) => res.data);
  } else {
    return axios
      .get<ProjectConfigResponse>(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data);
  }
};

export const forkProject = (
  namespace: string | undefined,
  projectName: string | undefined,
  tag: string | undefined = 'default',
  token: string | null = null,
  {
    forkTo,
    forkName,
    forkTag,
    forkDescription,
  }: {
    forkTo: string;
    forkName: string;
    forkTag: string | undefined;
    forkDescription: string | undefined;
  },
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}/forks?tag=${tag}`;
  if (!token) {
    return axios
      .post(url, {
        fork_to: forkTo,
        fork_name: forkName,
        fork_tag: forkTag || 'default',
        fork_description: forkDescription || '',
      })
      .then((res) => res.data);
  } else {
    return axios
      .post(
        url,
        {
          fork_to: forkTo || namespace,
          fork_name: forkName || projectName,
          fork_tag: forkTag || 'default',
          fork_description: forkDescription || '',
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then((res) => res.data);
  }
};

export const deleteProject = (namespace: string, projectName: string, tag: string = 'default', token: string) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}?tag=${tag}`;
  return axios.delete<DeleteProjectResponse>(url, { headers: { Authorization: `Bearer ${token}` } });
};

export const editProjectMetadata = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  token: string | null,
  metadata: ProjectUpdateMetadata,
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}?tag=${tag}`;
  return axios.patch(url, metadata, { headers: { Authorization: `Bearer ${token}` } });
};

export const editProjectConfig = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  token: string | null,
  config: string,
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}?tag=${tag}`;
  return axios.patch(url, { project_config_yaml: config }, { headers: { Authorization: `Bearer ${token}` } });
};

export const editProjectSampleTable = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  token: string | null,
  sampleTable: Sample[],
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}?tag=${tag}`;
  return axios.patch(
    url,
    {
      sample_table: sampleTable,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );
};

export const editProjectSubsampleTable = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  token: string | null,
  subsampleTable: Sample[],
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}?tag=${tag}`;
  return axios.patch(
    url,
    {
      subsample_table: subsampleTable,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );
};

export const editTotalProject = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  token: string | null,
  data: {
    config?: string;
    samples?: Sample[];
    subsamples?: Sample[];
  },
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}?tag=${tag}`;
  let requestBody = {};
  if (data.config) {
    requestBody = { ...requestBody, project_config_yaml: data.config };
  }
  if (data.samples) {
    requestBody = { ...requestBody, sample_table: data.samples };
  }
  if (data.subsamples && data.subsamples.length > 0) {
    requestBody = { ...requestBody, subsample_tables: [data.subsamples] };
  }

  return axios.patch(url, requestBody, { headers: { Authorization: `Bearer ${token}` } });
};

export const getProjectViews = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  token: string | null = null,
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}/views?tag=${tag}`;
  if (!token) {
    return axios.get<ProjectViewsResponse>(url).then((res) => res.data);
  } else {
    return axios
      .get<ProjectViewsResponse>(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data);
  }
};

export const getView = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  viewName: string,
  token: string | null = null,
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}/views/${viewName}?tag=${tag}&raw=false`;
  if (!token) {
    return axios.get<ProjectViewAnnotation>(url).then((res) => res.data);
  } else {
    return axios
      .get<ProjectViewAnnotation>(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data);
  }
};

export const addProjectView = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  token: string | null,
  params: CreateProjectViewRequest,
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}/views/${params.viewName}?description=${params.description}&tag=${tag}`;
  return axios.post<CreateProjectViewResponse>(
    url,
    params.sampleNames,
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const deleteProjectView = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  viewName: string,
  token: string | null,
) => {
  const url = `${API_BASE}/projects/${namespace}/${projectName}/views/${viewName}?tag=${tag}`;
  return axios.delete<DeleteProjectViewResponse>(
    url, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
}; 

export const getProjectAllHistory = (namespace: string, name: string, tag: string, jwt: string | null) => {
  const url = `${API_BASE}/projects/${namespace}/${name}/history?tag=${tag}`;
  return axios
    .get<ProjectAllHistoryResponse>(url, { headers: { Authorization: `Bearer ${jwt}` } })
    .then((res) => res.data);
};

export const getProjectHistory = (
  namespace: string,
  name: string,
  tag: string,
  jwt: string | null,
  historyId: number | null,
) => {
  const url = `${API_BASE}/projects/${namespace}/${name}/history/${historyId}?tag=${tag}`;
  return axios.get<ProjectHistory>(url, { headers: { Authorization: `Bearer ${jwt}` } }).then((res) => res.data);
};

export const deleteProjectHistory = (
  namespace: string,
  name: string,
  tag: string,
  jwt: string | null,
  historyId: number,
) => {
  const url = `${API_BASE}/projects/${namespace}/${name}/history/${historyId}?tag=${tag}`;
  return axios.delete<DeleteProjectResponse>(url, { headers: { Authorization: `Bearer ${jwt}` } });
};

export const restoreProjectFromHistory = (
  namespace: string,
  name: string,
  tag: string,
  jwt: string | null,
  historyId: number,
) => {
  const url = `${API_BASE}/projects/${namespace}/${name}/history/${historyId}/restore?tag=${tag}`;
  return axios.post<RestoreProjectFromHistoryResponse>(url, {}, { headers: { Authorization: `Bearer ${jwt}` } });
};

export const getStandardizedCols = (
  namespace: string,
  name: string,
  tag: string,
  jwt: string | null,
  schema: string,
) => {
  const url = `${API_BASE}/projects/${namespace}/${name}/standardize?schema=${schema}&tag=${tag}`;
  return axios
    .post<StandardizeColsResponse>(url, { headers: { Authorization: `Bearer ${jwt || 'NO_AUTHORIZATION'}` } })
    .then((res) => res.data);
};
