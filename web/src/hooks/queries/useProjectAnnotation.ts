import { useQuery } from '@tanstack/react-query';

import { getProjectAnnotation } from '../../api/project';

export const useProjectAnnotation = (
  namespace: string | undefined,
  project: string | undefined,
  tag: string | undefined,
  token: string | null,
) => {
  const query = useQuery({
    queryKey: [namespace, project, tag, 'annotation'],
    queryFn: () => getProjectAnnotation(namespace || '', project || '', tag, token),
    enabled: namespace !== undefined || project !== undefined,
  });
  return query;
};
