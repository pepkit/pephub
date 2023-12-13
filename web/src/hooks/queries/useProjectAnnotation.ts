import { useQuery } from '@tanstack/react-query';

import { getProjectAnnotation } from '../../api/project';
import { useSession } from '../useSession';

export const useProjectAnnotation = (
  namespace: string | undefined,
  project: string | undefined,
  tag: string | undefined,
) => {
  const session = useSession();
  const query = useQuery({
    queryKey: [namespace, project, tag, 'annotation'],
    queryFn: () => getProjectAnnotation(namespace || '', project || '', tag, session.jwt || ''),
    enabled: namespace !== undefined || project !== undefined,
  });
  return query;
};
