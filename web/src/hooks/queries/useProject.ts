import { useQuery } from '@tanstack/react-query';
import { getProject } from '../../api/project';

export const useProject = (
  namespace: string | undefined,
  project: string | undefined,
  tag: string | undefined,
  token: string | null,
) => {
  const query = useQuery({
    queryKey: [namespace, project, tag],
    queryFn: () => getProject(namespace || '', project || '', tag, token),
    enabled: namespace !== undefined || project !== undefined,
  });
  return query;
};
