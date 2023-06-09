import { useQuery } from '@tanstack/react-query';
import { SchemaResults } from '../../../types';
import axios from 'axios';

const fetchSchemas = async () => {
  const { data } = await axios.get<SchemaResults>('https://schema.databio.org/list.json');
  return data;
};

export const useSchemas = () => {
  return useQuery(['schemas'], fetchSchemas);
};
