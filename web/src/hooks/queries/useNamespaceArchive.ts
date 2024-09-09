import { useQuery } from '@tanstack/react-query';

import { getNamespaceArchive } from '../../api/namespace';

export const useNamespaceArchive = (namespace: string | undefined) => {
  return useQuery({
    queryKey: [namespace],
    queryFn: () => getNamespaceArchive(namespace || ''),
  });
};
