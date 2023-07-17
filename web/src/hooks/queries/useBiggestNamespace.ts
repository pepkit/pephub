import { useQuery } from '@tanstack/react-query';

import { getBiggestNamespaces } from '../../api/namespace';

export const useBiggestNamespace = (limit: number, ) => {
  const query = useQuery({
    queryKey: [limit],
    queryFn: () => getBiggestNamespaces(limit),
    enabled: limit !== undefined,
  });
  return query;
};
