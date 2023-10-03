import { useQuery } from '@tanstack/react-query';

import { getSampleTable } from '../../api/project';

export const useSampleTable = (
  namespace: string | undefined,
  project: string | undefined,
  tag: string | undefined,
  token: string | null,
) => {
  const query = useQuery({
    queryKey: [namespace, project, tag, 'samples'],
    queryFn: () => getSampleTable(namespace || '', project || '', tag, token),
    enabled: namespace !== undefined || project !== undefined,
  });
  return query;
};
