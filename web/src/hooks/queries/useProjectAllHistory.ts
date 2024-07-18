import { useQuery } from '@tanstack/react-query';

import { getProjectAllHistory } from '../../api/project';
import { useSession } from '../../contexts/session-context';

export const useProjectAllHistory = (namespace: string, projectName: string, tag: string = 'default') => {
  const { jwt } = useSession();
  return useQuery({
    queryKey: [namespace, projectName, tag, 'projectHistory'],
    queryFn: () => {
      return getProjectAllHistory(namespace, projectName, tag, jwt);
    },
  });
};
