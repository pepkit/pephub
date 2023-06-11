import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ValidationResult } from '../../../types';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

const runValidation = async (pep: FileList | string | undefined, schema: string | undefined) => {
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

  const { data: result } = await axios.post<ValidationResult>(`${API_BASE}/eido/validate`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return result;
};

export const useValidation = (
  pep: FileList | string | undefined,
  schema: string | undefined,
  enabled: boolean = false,
) => {
  return useQuery(['validation', pep, schema], () => runValidation(pep, schema), {
    enabled: enabled && pep !== undefined && schema !== undefined && pep.length > 0 && schema.length > 0,
    refetchOnWindowFocus: false,
    retry: false,
  });
};
