import { useQuery } from '@tanstack/react-query';

import { search } from '../../api/search';

export const useSearch = (
  q: string | undefined,
  limit: number | undefined,
  offset: number | undefined,
  scoreThreshold: number | undefined,
  token: string | null = null,
  enabled: boolean = false,
) => {
  const query = useQuery({
    queryKey: [q, limit, offset, scoreThreshold],
    queryFn: () => search(q || '', limit, offset, scoreThreshold, token),
    enabled: enabled && q !== undefined && q !== '',
    refetchOnWindowFocus: false,
  });
  return query;
};
