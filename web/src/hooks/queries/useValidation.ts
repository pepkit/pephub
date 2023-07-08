import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { ValidationResult } from '../../../types';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

export interface ValidationParams {
  pep: FileList | string | undefined;
  schema: string | undefined;
  schema_registry: string | undefined;
  enabled?: boolean;
}

const runValidation = async (params: ValidationParams) => {
  const { pep, schema, schema_registry } = params;

  let pep_registry: string | null = null;
  let pep_files: FileList | null | undefined = null;

  if (typeof pep === 'string') {
    pep_registry = pep;
    pep_files = null;
  } else {
    pep_registry = null;
    pep_files = pep;
  }

  // create form data
  const formData = new FormData();
  formData.append('pep_registry', pep_registry || '');
  if (pep_files) {
    for (let i = 0; i < pep_files.length; i++) {
      formData.append('pep_files', pep_files[i]);
    }
  }
  formData.append('schema', schema || '');
  formData.append('schema_registry', schema_registry || '');

  const { data: result } = await axios.post<ValidationResult>(`${API_BASE}/eido/validate`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return result;
};

export const useValidation = (params: ValidationParams) => {
  const { pep, schema, schema_registry, enabled } = params;
  return useQuery(['validation', pep, schema, schema_registry], () => runValidation(params), {
    enabled:
      enabled &&
      pep !== undefined &&
      schema !== undefined &&
      schema_registry !== undefined &&
      pep.length > 0 &&
      schema?.length > 0 &&
      schema_registry?.length > 0,
    refetchOnWindowFocus: false,
    retry: false,
  });
};
