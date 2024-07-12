import { useQuery } from '@tanstack/react-query';

import { getMultiProjectAnnotation } from '../../api/project';
import { useSession } from '../../contexts/session-context';

export const useMultiProjectAnnotation = (registry_paths: string[] | undefined) => {
  const session = useSession();
  const query = useQuery({
    queryKey: ['annotation', ...(registry_paths || [])],
    queryFn: () => getMultiProjectAnnotation(registry_paths || [], session.jwt || ''),
    enabled: registry_paths !== undefined,
  });
  return query;
};
