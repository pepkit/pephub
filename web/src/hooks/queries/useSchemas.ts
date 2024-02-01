import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { SchemaResults } from '../../../types';

const fetchSchemas = async () => {
  const { data } = await axios.get<SchemaResults>('https://schema.databio.org/list.json');
  // strip all schemas/ from the keys
  const stripped = Object.keys(data).reduce((acc, key) => {
    acc[key.replace('schemas/', '')] = data[key];
    return acc;
  }, {} as SchemaResults);
  return stripped;
};

export const useSchemas = () => {
  return useQuery({
    queryKey: ['schemas'],
    queryFn: () => fetchSchemas(),
  });
};
