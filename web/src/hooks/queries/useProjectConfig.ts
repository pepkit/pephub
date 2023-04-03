import { useQuery } from '@tanstack/react-query';
import { getProjectConfig } from '../../api/project';

export const useProjectConfig = (
  namespace: string | undefined,
  project: string | undefined,
  tag: string | undefined,
  filter: string | undefined = 'yaml',
  token: string | null,
) => {
  const query = useQuery({
    queryKey: [namespace, project, tag, 'config'],
    queryFn: () => getProjectConfig(namespace || '', project || '', tag, filter, token),
    enabled: namespace !== undefined || project !== undefined,
  });
  return query;
};
