import { useQuery } from '@tanstack/react-query';

import { getProjectHistory } from '../../api/project';
import { useSession } from '../../contexts/session-context';

export const useProjectHistory = (
  namespace: string,
  projectName: string,
  tag: string = 'default',
  historyId: number | null,
) => {
  const { jwt } = useSession();
  return useQuery({
    queryKey: [namespace, projectName, tag, 'projectHistory', historyId],
    queryFn: () => {
      return getProjectHistory(namespace, projectName, tag, jwt, historyId);
    },
    enabled: historyId !== null,
  });
};
