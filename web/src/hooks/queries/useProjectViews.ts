import { useQuery } from '@tanstack/react-query';

import { getProjectViews } from '../../api/project';
import { useSession } from '../../contexts/session-context';

export const useProjectViews = (
  namespace: string | undefined,
  project: string | undefined,
  tag: string | undefined,
) => {
  const session = useSession();
  const query = useQuery({
    queryKey: [namespace, project, tag, 'views'],
    queryFn: () => getProjectViews(namespace!, project!, tag, session.jwt || ''),
    enabled: !!namespace && !!project,
  });
  return query;
};
