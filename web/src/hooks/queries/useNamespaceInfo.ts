import { useQuery } from '@tanstack/react-query';

import { getNamespaceInfo } from '../../api/namespace';
import { useSession } from '../../contexts/session-context';

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
