import { useQuery } from '@tanstack/react-query';
import { getNamespaceInfo } from '../../api/namespace';

export const useNamespaceInfo = (namespace: string | undefined, token: string | null = null) => {
  const query = useQuery({
    queryKey: [namespace],
    queryFn: () => getNamespaceInfo(namespace || '', token),
    enabled: namespace !== undefined,
    retry: false,
  });
  return query;
};
