import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SchemaResults } from '../../../types';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

const fetchSchemas = async () => {
  const { data } = await axios.get<SchemaResults>(`${API_BASE}/eido/schemas`);
  return data;
};

export const useSchemas = () => {
  return useQuery(['schemas'], fetchSchemas);
};
