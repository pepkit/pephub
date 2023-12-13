import { useQuery } from '@tanstack/react-query';

import { getNamespaceInfo } from '../../api/namespace';
import { useSession } from '../useSession';

export const useNamespaceInfo = (namespace: string | undefined) => {
  const session = useSession();
  const query = useQuery({
    queryKey: [namespace],
    queryFn: () => getNamespaceInfo(namespace || '', session.jwt || ''),
    enabled: namespace !== undefined && session.jwt !== null,
    retry: false,
  });
  return query;
};
