import { useQuery } from '@tanstack/react-query';

import { getSubsampleTable } from '../../api/project';
import { useSession } from '../../contexts/session-context';

export const useSubsampleTable = (
  namespace: string | undefined,
  project: string | undefined,
  tag: string | undefined,
) => {
  const session = useSession();
  const query = useQuery({
    queryKey: [namespace, project, tag, 'subsamples'],
    queryFn: () => getSubsampleTable(namespace || '', project || '', tag, session.jwt || ''),
    enabled: namespace !== undefined && project !== undefined,
  });
  return query;
};
