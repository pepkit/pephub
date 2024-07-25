import { useQuery } from '@tanstack/react-query';

import { getSchema } from '../../api/schemas';

export const useSchema = (namespace: string | undefined, name: string | undefined) => {
  return useQuery({
    queryKey: ['schema', namespace, name],
    queryFn: () => getSchema(namespace!, name!),
    enabled: !!namespace && !!name,
  });
};
