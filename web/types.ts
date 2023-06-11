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
  [key: string]: string;
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
  project: string;
  url: string;
}

// SchemaResults is a list of Schemas
export interface SchemaResults {
  [key: string]: Schema;
}

export interface ValidationResult {
  valid: boolean;
  errors: string;
}
