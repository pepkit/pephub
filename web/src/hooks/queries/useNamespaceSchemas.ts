import { useQuery } from '@tanstack/react-query';

import { getNamespaceSchemas, SchemaPaginationParams } from '../../api/schemas';

export const useNamespaceSchemas = (namespace: string | undefined, params: SchemaPaginationParams) => {
  const query = useQuery({
    queryKey: ['schemas', namespace, params],
    queryFn: () => getNamespaceSchemas(namespace!, params),
    enabled: !!namespace,
  });
  return query;
};
