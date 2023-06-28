import axios from 'axios';

import { Project, Sample } from '../../types';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

interface ProjectUpdateItems {
  project_value?: Project | null;
  tag?: string | null;
  is_private?: boolean | null;
  name?: string | null;
  pep_schema?: string | null;
}

interface ProjectUpdateMetadata extends ProjectUpdateItems {
  sample_table?: Sample[] | null;
  project_config_yaml?: string | null;
  description?: string | null;
  subsample_list?: string[] | null;
}
export interface SampleTableResponse {
  count: number;
  items: Sample[];
}

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
  const url = `${API_BASE}/projects/${namespace}/${projectName}/samples?tag=${tag}&raw=true`;
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
  const url = `${API_BASE}/projects/${namespace}/${projectName}?tag=${tag}&format=csv`;
  return axios.patch(
    url,
    {
      sample_table: sampleTable,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );
};
