import { useQuery } from '@tanstack/react-query';

import { getView } from '../../api/project';
import { useSession } from '../useSession';

interface ViewParams {
  namespace: string | undefined;
  project: string | undefined;
  tag: string | undefined;
  view: string | undefined;
  enabled?: boolean;
}

export const useView = (params: ViewParams) => {
  const { namespace, project, tag, view, enabled } = params;
  const session = useSession();
  const query = useQuery({
    queryKey: [namespace, project, tag, 'view', view],
    queryFn: () => getView(namespace!, project!, tag, view!, session.jwt || ''),
    enabled: enabled && !!namespace && !!project && !!view,
  });
  return query;
};
