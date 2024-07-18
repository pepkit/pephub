import { useQuery } from '@tanstack/react-query';

import { PaginationParams, getNamespaceStars } from '../../api/namespace';
import { useSession } from '../../contexts/session-context';

export const useNamespaceStars = (
  namespace: string | undefined,
  params: PaginationParams = {},
  enabled: boolean = false,
) => {
  const { jwt } = useSession();

  const starsQuery = useQuery({
    queryKey: [namespace, 'stars'],
    queryFn: () => {
      if (!namespace) {
        throw new Error('Namespace is required to fetch stars');
      }
      return getNamespaceStars(namespace, jwt || '', params);
    },
    enabled: !!namespace && enabled && namespace !== undefined && jwt !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return starsQuery;
};
