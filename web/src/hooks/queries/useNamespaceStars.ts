import { useQuery } from '@tanstack/react-query';

import { PaginationParams, getNamespaceStars } from '../../api/namespace';
import { useSession } from '../useSession';

export const useNamespaceStars = (
  namespace: string | undefined,
  params: PaginationParams = {},
  enabled: boolean = false,
) => {
  const session = useSession();
  const query = useQuery({
    queryKey: [namespace, 'stars'],
    queryFn: () => getNamespaceStars(namespace || '', session?.jwt || '', params),
    enabled: enabled && namespace !== undefined && session?.jwt !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  return query;
};
