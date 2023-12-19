import { useQuery } from '@tanstack/react-query';

import { PaginationParams, getAllNamespaces } from '../../api/namespace';

export const useSearchForNamespaces = (params: PaginationParams) => {
  const { search, offset, limit } = params;
  const query = useQuery({
    queryKey: ['namespace-search', search, offset, limit],
    queryFn: () => getAllNamespaces(search, limit, offset),
  });
  return query;
};
