import { useQuery } from '@tanstack/react-query';

import { search } from '../../api/search';
import { useSession } from '../useSession';

export const useSearch = (
  q: string | undefined,
  limit: number | undefined,
  offset: number | undefined,
  scoreThreshold: number | undefined,
) => {
  const session = useSession();
  const query = useQuery({
    queryKey: [q, limit, offset, scoreThreshold],
    queryFn: () => search(q || '', limit, offset, scoreThreshold, session.jwt || ''),
    enabled: q !== undefined && q !== '',
    refetchOnWindowFocus: false,
  });
  return query;
};
