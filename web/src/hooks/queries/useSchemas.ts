import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { SchemaResults } from '../../../types';

const fetchSchemas = async () => {
  const { data } = await axios.get<SchemaResults>('https://schema.databio.org/list.json');
  return data;
};

export const useSchemas = () => {
  return useQuery(['schemas'], fetchSchemas);
};
