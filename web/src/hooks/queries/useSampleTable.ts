import { useQuery } from '@tanstack/react-query';

import { getSampleTable } from '../../api/project';
import { useSession } from '../useSession';

export const useSampleTable = (namespace: string | undefined, project: string | undefined, tag: string | undefined) => {
  const session = useSession();
  const query = useQuery({
    queryKey: [namespace, project, tag, 'samples'],
    queryFn: () => getSampleTable(namespace || '', project || '', tag, session.jwt || ''),
    enabled: namespace !== undefined || project !== undefined,
  });
  return query;
};
