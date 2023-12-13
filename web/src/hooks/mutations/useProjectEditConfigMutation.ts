import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { editProjectConfig } from '../../api/project';
import { useSession } from '../useSession';

export const useProjectEditConfigMutation = (
  namespace: string,
  project: string,
  tag: string,
  newProjectConfig: string,
  onSuccess?: () => void,
) => {
  const session = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => editProjectConfig(namespace, project, tag, session.jwt || '', newProjectConfig),
    onSuccess: () => {
      toast.success('Project config saved successfully');
      queryClient.invalidateQueries({
        queryKey: [namespace, project, tag],
      });

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: AxiosError) => {
      // if there exists a response body, render that
      if (error.response?.data) {
        toast.error(JSON.stringify(error.response.data, null, 2));
      } else {
        toast.error(`Error saving project config: ${error}`);
      }
    },
  });
};
