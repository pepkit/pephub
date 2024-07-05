import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { search } from '../../api/search';
import { useSession } from '../useSession';

const DEFAULT_LIMIT = 10;
const DEFAULT_OFFSET = 0;
const DEFAULT_AUTO_RUN = false;
const DEFAULT_SCORE_THRESHOLD = 0.65;

interface SearchParams {
  q: string;
  offset?: number;
  limit?: number;
  scoreThreshold?: number;
  autoRun?: boolean;
}

export const useSearch = (params: SearchParams) => {
  const session = useSession();
  const { q, offset, autoRun, limit, scoreThreshold } = params;

  const _offset = offset || DEFAULT_OFFSET;
  const _autoRun = autoRun || DEFAULT_AUTO_RUN;
  const _limit = limit || DEFAULT_LIMIT;
  const _scoreThreshold = scoreThreshold || DEFAULT_SCORE_THRESHOLD;

  const query = useQuery({
    queryKey: ['search', q, offset],
    queryFn: () => search(q, _limit, _offset, _scoreThreshold, session.jwt || ''),
    enabled: _autoRun && !!q, // only run if autoRun is true and q is not empty
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  return query;
};
