import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Schema } from '../../../types';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

const fetchSchema = async (registry: string) => {
  const { data } = await axios.get<Schema>(`${API_BASE}/eido/schemas/${registry}`);
  return data;
};

export const useSchema = (registry: string | undefined) => {
  return useQuery(['schema', registry], () => fetchSchema(registry || ''), {
    enabled: registry !== undefined && registry.length > 0,
    refetchOnWindowFocus: false,
  });
};
