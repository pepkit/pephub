import { useQuery } from '@tanstack/react-query';

import { PaginationParams } from '../../api/namespace';
import { getNamespaceSchemas } from '../../api/schemas';

export const useNamespaceSchemas = (namespace: string | undefined, params: PaginationParams) => {
  const query = useQuery({
    queryKey: ['schemas', namespace, params],
    queryFn: () => getNamespaceSchemas(namespace!, params),
    enabled: !!namespace,
  });
  return query;
};
