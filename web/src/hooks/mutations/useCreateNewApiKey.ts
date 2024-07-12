import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { createNewApiKey } from '../../api/auth';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type CreateNewApiKeyMutationProps = {
  onKeyCreated?: (newKey: string) => void;
};

export const useCreateNewApiKey = (createNewKeyProps: CreateNewApiKeyMutationProps) => {
  const { user, jwt } = useSession();
  const queryClient = useQueryClient();

  if (!user || !jwt) {
    throw new Error('No user or jwt found');
  }

  const mutation = useMutation({
    mutationFn: () => {
      return createNewApiKey(jwt);
    },
    onSuccess: (data) => {
      if (createNewKeyProps.onKeyCreated) {
        createNewKeyProps.onKeyCreated(data.key.key);
      }

      toast.success('API key successfully created.');

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
