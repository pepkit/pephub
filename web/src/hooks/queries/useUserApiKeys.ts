import { useQuery } from '@tanstack/react-query';

import { getUserApiKeys } from '../../api/auth';
import { useSession } from '../useSession';

export const useUserApiKeys = () => {
  const { user, jwt } = useSession();

  if (!user || !jwt) {
    throw new Error('No user or jwt found');
  }

  const query = useQuery({
    queryKey: [user.login, 'api-keys'],
    queryFn: () => getUserApiKeys(jwt),
    enabled: !!user,
  });
  return query;
};
