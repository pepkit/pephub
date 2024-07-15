import { useQuery } from '@tanstack/react-query';

import { PaginationParams } from '../../api/namespace';
import { getNamespaceProjects } from '../../api/namespace';
import { useSession } from '../useSession';

// extend PaginationParams to include type
export interface NamespaceProjectsParams extends PaginationParams {
  type?: 'pep' | 'pop';
}

export const useNamespaceProjects = (namespace: string | undefined, params: NamespaceProjectsParams) => {
  const session = useSession();
  const query = useQuery({
    queryKey: [namespace, params],
    queryFn: () => getNamespaceProjects(namespace || '', session.jwt, params, params.type),
    enabled: namespace !== undefined && namespace !== '',
  });
  return query;
};
