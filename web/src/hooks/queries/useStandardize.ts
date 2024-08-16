import { useQuery } from '@tanstack/react-query';

import { getStandardizedCols } from '../../api/project';
import { useSession } from '../../contexts/session-context';

export const useStandardize = (namespace: string | undefined, project: string | undefined, tag: string | undefined, schema: string | undefined) => {
  const session = useSession();
  const query = useQuery({
    queryKey: [namespace, project, tag],
    queryFn: () => getStandardizedCols(namespace || '', project || '', tag, session?.jwt || '', schema || ''),
    enabled: namespace !== undefined || (project !== undefined && session?.jwt !== null) || schema !== null,
  });
  return query;
};
