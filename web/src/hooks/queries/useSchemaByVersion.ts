import { useQuery } from '@tanstack/react-query';

import { getSchemaByVersion } from '../../api/schemas';

export const useSchemaByVersion = (namespace: string | undefined, name: string | undefined, version: string | undefined) => {
  return useQuery({
    queryKey: ['schema', namespace, name, version],
    queryFn: () => getSchemaByVersion(namespace!, name!, version!),
    enabled: !!namespace && !!name && !!version,
  });
};
