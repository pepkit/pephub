import { useQuery } from '@tanstack/react-query';

import { getSchemaVersions } from '../../api/schemas';

export const useSchemaVersions = (
  namespace: string | undefined,
  name: string | undefined,
  options?: {
    query?: string;
    tag?: string;
    page?: number;
    page_size?: number;
  }
) => {
  const {
    query = '',
    tag = '',
    page = 0,
    page_size = 100
  } = options || {};

  return useQuery({
    queryKey: ['schema', namespace, name, query, tag, page, page_size],
    queryFn: () => getSchemaVersions(namespace || '', name || '', query, tag, page, page_size),
    enabled: !!namespace && !!name,
  });
};
