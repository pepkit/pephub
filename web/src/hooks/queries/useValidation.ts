import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ValidationResult } from '../../../types';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

interface ValidationParams {
  pep: FileList | string | undefined,
  schema: string | undefined,
  schema_registry: string | undefined,
  enabled?: boolean,
}

const runValidation = async (params: ValidationParams) => {
  let pep_registry: string | null = null;
  let pep_files: FileList | null | undefined = null;

  if (typeof params.pep === 'string') {
    pep_registry = params.pep;
    pep_files = null;
  } else {
    pep_registry = null;
    pep_files = params.pep;
  }

  // create form data
  const formData = new FormData();
  formData.append('pep_registry', pep_registry || '');
  if (pep_files) {
    for (let i = 0; i < pep_files.length; i++) {
      formData.append('pep_files', pep_files[i]);
    }
  }
  formData.append('schema', params.schema || '');
  formData.append('schema_registry', params.schema_registry || '');

  const { data: result } = await axios.post<ValidationResult>(`${API_BASE}/eido/validate`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return result;
};

export const useValidation = (params: ValidationParams) => {
  return useQuery(['validation', params.pep, params.schema, params.schema_registry], () => runValidation(params), {
    enabled: params.enabled && params.pep !== undefined && params.schema !== undefined && params.schema_registry
     !== undefined && params.pep.length > 0 && params.schema?.length > 0 && params.schema_registry?.length > 0,
    refetchOnWindowFocus: false,
    retry: false,
  });
};