import { useQuery } from '@tanstack/react-query';

import { PaginationParams } from '../../api/namespace';
import { getNamespaceProjects } from '../../api/namespace';
import { useSession } from '../useSession';

export const useNamespaceProjects = (namespace: string | undefined, params: PaginationParams) => {
  const session = useSession();
  const query = useQuery({
    queryKey: [namespace, params],
    queryFn: () => getNamespaceProjects(namespace || '', session.jwt, params),
    enabled: namespace !== undefined && session.jwt !== null,
  });
  return query;
};
