import { useQuery } from '@tanstack/react-query';

import { getSampleTable } from '../../api/project';
import { useSession } from '../useSession';

interface SampleTableQuery {
  namespace?: string;
  project?: string;
  tag?: string;
  enabled?: boolean;
}

export const useSampleTable = (sampleTableQuery: SampleTableQuery) => {
  const { namespace, project, tag, enabled } = sampleTableQuery;

  const enableQuery = enabled && !!namespace && !!project && !!tag;

  const session = useSession();
  const query = useQuery({
    queryKey: [namespace, project, tag, 'samples'],
    queryFn: () => getSampleTable(namespace || '', project || '', tag, session.jwt || ''),
    enabled: enableQuery === undefined ? false : enableQuery,
  });
  return query;
};
