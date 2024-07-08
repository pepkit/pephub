import { useQuery } from 'react-query';

import { useSession } from '../useSession';

export const useProjectHistory = (namespace: string, projectName: string, tag: string = 'default') => {
  const { jwt } = useSession();
  return useQuery({
    queryKey: [namespace, projectName, tag, 'projectHistory'],
  });
};
