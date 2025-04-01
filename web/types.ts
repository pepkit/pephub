export interface ProjectAnnotation {
  namespace: string;
  name: string;
  tag: string;
  is_private: boolean;
  number_of_samples: number;
  description: string;
  last_update_date: string;
  submission_date: string;
  digest: string;
  pep_schema: string;
  pop: boolean;
  stars_number: number;
  forked_from?: string;
}

export interface ProjectConfigResponse {
  config: string;
}

export interface User {
  orgs: string[];
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  hireable: boolean;
  bio: string;
  twitter_username: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  exp: number;
}

export interface Sample {
  [key: string]: string | null;
}

export interface Project {
  pep_version: string;
  sample_table: string;
  namespace: string;
  name: string;
  tag: string;
  is_private: boolean;
  number_of_samples: number;
  description: string;
  last_update_date: string;
  submission_date: string;
  digest: string;
  samples: Sample[];
  sample_table_indx: string;
  sample_attributes: string[];
  pep_schema: string;
  pop: boolean;
}

export interface SearchHit {
  id: number;
  version: number;
  score: number;
  payload: {
    description: string;
    registry: string;
  };
  vector: null;
}

export interface Schema {
  description: string;
  version: string;
  properties: object;
  required: string[];
}

// SchemaResults is a list of Schemas
export interface SchemaResults {
  [key: string]: Schema;
}

export interface ValidationResult {
  valid: boolean;
  error_type: string;
  errors: string[];
}

export interface BiggestNamespaceResults {
  namespace_name: string;
  number_of_projects: number;
  number_of_samples: number;
}

export interface ProjectViewAnnotation {
  name: string;
  description?: string;
  number_of_samples: number;
  samples: Sample[];
}

export type ProjectAllHistory = {
  change_id: number;
  change_date: string;
  user: string;
};

export type ProjectHistory = {
  _config: string;
  _subsample_list: any[];
  _sample_dict: Sample[];
};

export interface PaginationResult {
  page: number;
  page_size: number;
  total: number | null;
}

export interface ValidationError {
  loc?: string[];
  type?: string;
  input?: string;
  msg: string;
}
