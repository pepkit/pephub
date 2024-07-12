import { useQuery } from '@tanstack/react-query';

import { PaginationParams, getNamespaceStars } from '../../api/namespace';
import { useSession } from '../../contexts/session-context';
import { useAddStar } from '../mutations/useAddStar';
import { useRemoveStar } from '../mutations/useRemoveStar';

export const useNamespaceStars = (namespace: string, params: PaginationParams = {}, enabled: boolean = false) => {
  const { jwt } = useSession();

  const starsQuery = useQuery({
    queryKey: [namespace, 'stars'],
    queryFn: () => getNamespaceStars(namespace, jwt || '', params),
    enabled: enabled && namespace !== undefined && jwt !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const addStarMutation = useAddStar(namespace);
  const removeStarMutation = useRemoveStar(namespace);

  return {
    starsQuery,
    addStarMutation,
    removeStarMutation,
  };
};
