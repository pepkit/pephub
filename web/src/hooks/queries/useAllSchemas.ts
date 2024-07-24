import { useQuery } from '@tanstack/react-query';

import { PaginationParams } from '../../api/namespace';
import { getSchemas } from '../../api/schemas';

export const useAllSchemas = (params: PaginationParams) => {
  return useQuery({
    queryKey: ['schemas', params],
    queryFn: () => getSchemas(params),
  });
};
