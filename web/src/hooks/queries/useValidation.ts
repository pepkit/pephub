import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { ValidationResult } from '../../../types';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

export interface ValidationParams {
  pepRegistry?: string | null;
  pepFiles?: FileList | null;
  schema?: string | null;
  schema_file?: File | null;
  schema_registry?: string | null;
  enabled?: boolean;
}

const runValidation = async (params: ValidationParams) => {
  const { pepRegistry, pepFiles, schema, schema_registry } = params;

  // create form data
  const formData = new FormData();

  // PEP things
  formData.append('pep_registry', pepRegistry || '');
  if (pepFiles) {
    for (let i = 0; i < pepFiles.length; i++) {
      formData.append('pep_files', pepFiles[i]);
    }
  }

  // Schema things
  formData.append('schema', schema || '');
  if (params.schema_file) {
    formData.append('schema_file', params.schema_file);
  }
  if (schema_registry) {
    formData.append('schema_registry', schema_registry);
  }
  const { data: result } = await axios.post<ValidationResult>(`${API_BASE}/eido/validate`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return result;
};

export const useValidation = (params: ValidationParams) => {
  const { pepRegistry, pepFiles, schema, schema_registry, enabled } = params;
  return useQuery({
    queryKey: ['validation', pepRegistry, pepFiles, schema, schema_registry],
    queryFn: () => runValidation(params),
    enabled: enabled,
    refetchOnWindowFocus: false,
    retry: false,
  });
};
