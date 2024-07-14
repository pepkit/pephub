import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { editProjectConfig } from '../../api/project';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

export const useConfigMutation = (namespace: string, project: string, tag: string) => {
  const session = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newProjectConfig: string) => editProjectConfig(namespace, project, tag, session.jwt, newProjectConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [namespace, project, tag],
      });
      toast.success('Successfully updated project config');
    },
    onError: (err: AxiosError) => {
      // extract out error message if it exists, else unknown
      const errorMessage = extractErrorMessage(err);
      toast.error(`${errorMessage}`, {
        duration: 5000,
      });
    },
  });

  return {
    ...mutation,
    editConfig: mutation.mutate,
  };
};
