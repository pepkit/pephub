import { useQuery } from '@tanstack/react-query';

import { getSubsampleTable } from '../../api/project';

export const useSubsampleTable = (
  namespace: string | undefined,
  project: string | undefined,
  tag: string | undefined,
  token: string | null,
) => {
  const query = useQuery({
    queryKey: [namespace, project, tag, 'subsamples'],
    queryFn: () => getSubsampleTable(namespace || '', project || '', tag, token),
    enabled: namespace !== undefined || project !== undefined,
  });
  return query;
};
