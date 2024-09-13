import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getStandardizerSchemas } from '../../api/namespace';

export const useStandardizerSchemas = (
  namespace: string | undefined,
): UseQueryResult<string[], Error> => {

  return useQuery<string[], Error>({
    queryKey: ['standardizerSchemas', namespace],
    queryFn: () => {
      if (!namespace) {
        throw new Error('Namespace is required');
      }
      return getStandardizerSchemas(namespace);
    },
    enabled: !!namespace,
  });
};