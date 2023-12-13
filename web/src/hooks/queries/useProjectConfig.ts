import { useQuery } from '@tanstack/react-query';

import { getProjectConfig } from '../../api/project';
import { useSession } from '../useSession';

export const useProjectConfig = (
  namespace: string | undefined,
  project: string | undefined,
  tag: string | undefined,
) => {
  const session = useSession();
  const query = useQuery({
    queryKey: [namespace, project, tag, 'config'],
    queryFn: () => getProjectConfig(namespace || '', project || '', tag, session.jwt || ''),
    enabled: namespace !== undefined || project !== undefined,
  });
  return query;
};
