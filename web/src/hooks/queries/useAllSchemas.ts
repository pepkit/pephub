import { useQuery } from '@tanstack/react-query';

import { getSchemas, SchemaPaginationParams } from '../../api/schemas';

export const useAllSchemas = (params: SchemaPaginationParams) => {
  return useQuery({
    queryKey: ['schemas', params],
    queryFn: () => getSchemas(params),
  });
};
