import { useQuery } from '@tanstack/react-query';

import { getProject } from '../../api/project';
import { useSession } from '../../contexts/session-context';

export const useProject = (namespace: string | undefined, project: string | undefined, tag: string | undefined) => {
  const session = useSession();
  const query = useQuery({
    queryKey: [namespace, project, tag],
    queryFn: () => getProject(namespace || '', project || '', tag, session?.jwt || ''),
    enabled: namespace !== undefined || (project !== undefined && session?.jwt !== null),
  });
  return query;
};
