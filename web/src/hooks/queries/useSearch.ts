import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { search } from '../../api/search';
import { useSession } from '../useSession';

const DEFAULT_LIMIT = 10;
const DEFAULT_OFFSET = 0;
const DEFAULT_AUTO_RUN = false;
const SCORE_THRESHOLD = 0.73;
export const SEARCH_LIMIT = 1000;

interface SearchParams {
  q: string;
  offset?: number;
  autoRun?: boolean;
}

export const useSearch = (params: SearchParams) => {
  const session = useSession();
  const { q, offset, autoRun } = params;

  const _offset = offset || DEFAULT_OFFSET;
  const _autoRun = autoRun || DEFAULT_AUTO_RUN;

  const query = useQuery({
    queryKey: ['search', q, offset],
    queryFn: () => search(q, SEARCH_LIMIT, _offset, SCORE_THRESHOLD, session.jwt || ''),
    enabled: _autoRun && q !== '', // only run if autoRun is true and q is not empty
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  return query;
};
