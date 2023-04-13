import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ValidationResult } from '../../../types';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

const runValidation = async (pepFiles: FileList | string | undefined, schema: string | undefined) => {
  const { data: result } = await axios.post<ValidationResult>(
    `${API_BASE}/eido/validate`,
    {
      pep: pepFiles,
      schema: schema,
    },
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return result;
};

export const useValidation = (
  pepFiles: FileList | string | undefined,
  schema: string | undefined,
  enabled: boolean = false,
) => {
  return useQuery(['validation', pepFiles, schema], () => runValidation(pepFiles, schema), {
    enabled: enabled && pepFiles !== undefined && schema !== undefined && pepFiles.length > 0 && schema.length > 0,
    refetchOnWindowFocus: false,
  });
};
