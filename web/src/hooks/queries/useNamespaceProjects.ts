import { useQuery } from '@tanstack/react-query';

import { PaginationParams } from '../../api/namespace';
import { getNamespaceProjects } from '../../api/namespace';

export const useNamespaceProjects = (namespace: string | undefined, token: string | null, params: PaginationParams) => {
  const query = useQuery({
    queryKey: [namespace, params],
    queryFn: () => getNamespaceProjects(namespace || '', token, params),
    enabled: namespace !== undefined,
  });
  return query;
};
