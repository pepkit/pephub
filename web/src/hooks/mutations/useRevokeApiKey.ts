import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { revokeApiKey } from '../../api/auth';
import { extractErrorMessage } from '../../utils/etc';
import { useSession } from '../useSession';

type RevokeRequest = {
  lastFiveChars: string;
};

export const useRevokeApiKey = () => {
  const { user, jwt } = useSession();
  const queryClient = useQueryClient();

  if (!user || !jwt) {
    throw new Error('No user or jwt found');
  }

  const mutation = useMutation({
    mutationFn: (rq: RevokeRequest) => {
      return revokeApiKey(jwt, rq.lastFiveChars);
    },
    onSuccess: () => {
      toast.success('API key successfully revoked.');
      queryClient.invalidateQueries({
        queryKey: [user.login, 'api-keys'],
      });
    },
    onError: (err: AxiosError) => {
      // extract out error message if it exists, else unknown
      const errorMessage = extractErrorMessage(err);
      toast.error(`${errorMessage}`, {
        duration: 5000,
      });
    },
  });

  return mutation;
};
