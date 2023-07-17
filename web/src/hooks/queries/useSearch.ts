import { useQuery } from '@tanstack/react-query';

import { search } from '../../api/search';

export const useSearch = (
  q: string | undefined,
  limit: number | undefined,
  offset: number | undefined,
  scoreThreshold: number | undefined,
  token: string | null = null,
) => {
  const query = useQuery({
    queryKey: [q, limit, offset, scoreThreshold],
    queryFn: () => search(q || '', limit, offset, scoreThreshold, token),
    enabled: q !== undefined && q !== '',
    refetchOnWindowFocus: false,
  });
  return query;
};
