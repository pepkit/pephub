import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { BiggestNamespaces, getBiggestNamespaces } from '../../api/namespace';
import { useLocalStorage } from '../useLocalStorage';

// create a type that just extends result of useQuery with a timestamp
type BiggestNamespaceResultsCached = UseQueryResult<BiggestNamespaces> & { timestamp: number };

export const useBiggestNamespace = (
  limit: number,
  staleTime: number = 1000 * 60 * 60 * 24, // 24 hours
) => {
  // @ts-ignore
  const [valueCached, setValueCached] = useLocalStorage<BiggestNamespaceResultsCached>('biggest-namespaces', {});

  const query = useQuery({
    queryKey: ['biggest-namespaces', limit],
    queryFn: () => getBiggestNamespaces(limit),
    enabled: false,
  });

  useEffect(() => {
    if (query.data) {
      setValueCached({ ...query, timestamp: Date.now() });
    }
    // update if timestamp is stale
    if (!valueCached.timestamp || valueCached.timestamp < Date.now() - staleTime) {
      query.refetch();
    }
  }, [query.data]);

  return valueCached;
};
