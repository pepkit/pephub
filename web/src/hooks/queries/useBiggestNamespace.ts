import { useQuery } from '@tanstack/react-query';

import { getBiggestNamespaces } from '../../api/namespace';

export const useBiggestNamespace = (limit: number) => {
  return useQuery({
    queryKey: ['biggest-namespaces', limit],
    queryFn: () => getBiggestNamespaces(limit),
  });
};
