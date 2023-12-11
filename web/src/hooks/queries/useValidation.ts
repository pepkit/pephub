import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { ValidationResult } from '../../../types';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

export interface ValidationParams {
  pep_registry?: string | null;
  pep_files?: FileList | null;
  schema?: string | null;
  schema_file?: File | null;
  schema_registry?: string | null;
  enabled?: boolean;
}

const runValidation = async (params: ValidationParams) => {
  const { pep_registry, pep_files, schema, schema_registry } = params;

  // create form data
  const formData = new FormData();

  // PEP things
  formData.append('pep_registry', pep_registry || '');
  if (pep_files) {
    for (let i = 0; i < pep_files.length; i++) {
      formData.append('pep_files', pep_files[i]);
    }
  }

  // Schema things
  formData.append('schema', schema || '');
  formData.append('schema_file', params.schema_file || '');
  formData.append('schema_registry', schema_registry || '');

  const { data: result } = await axios.post<ValidationResult>(`${API_BASE}/eido/validate`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return result;
};

export const useValidation = (params: ValidationParams) => {
  const { pep_registry, pep_files, schema, schema_registry, enabled } = params;
  return useQuery({
    queryKey: ['validation', pep_registry, pep_files, schema, schema_registry],
    queryFn: () => runValidation(params),
    enabled: enabled,
    refetchOnWindowFocus: false,
    retry: false,
  });
};
