import { useQuery } from '@tanstack/react-query';

import { getNamespaceSchemas, SchemaPaginationParams } from '../../api/schemas';

export const useNamespaceSchemas = (namespace: string | undefined, params: SchemaPaginationParams, name?: string) => {
  const query = useQuery({
    queryKey: ['schemas', namespace, params, name],
    queryFn: () => getNamespaceSchemas(namespace!, params, name),
    enabled: !!namespace,
  });
  return query;
};
