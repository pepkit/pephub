import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { search } from '../../api/search';
import { useSession } from '../useSession';

const DEFAULT_LIMIT = 10;
const DEFAULT_OFFSET = 0;
const DEFAULT_SCORE_THRESHOLD = 0.5;
const DEFAULT_AUTO_RUN = false;

interface SearchParams {
  q: string;
  limit?: number;
  offset?: number;
  scoreThreshold?: number;
  autoRun?: boolean;
}

export const useSearch = (params: SearchParams) => {
  const session = useSession();
  const { q, limit, offset, scoreThreshold, autoRun } = params;

  const _limit = limit || DEFAULT_LIMIT;
  const _offset = offset || DEFAULT_OFFSET;
  const _scoreThreshold = scoreThreshold || DEFAULT_SCORE_THRESHOLD;
  const _autoRun = autoRun || DEFAULT_AUTO_RUN;

  const query = useQuery({
    queryKey: ['search', q, limit, offset, scoreThreshold],
    queryFn: () => search(q, _limit, _offset, _scoreThreshold, session.jwt || ''),
    enabled: _autoRun && q !== '', // only run if autoRun is true and q is not empty
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  return query;
};
