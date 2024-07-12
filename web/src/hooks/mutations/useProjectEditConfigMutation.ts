import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { editProjectConfig } from '../../api/project';
import { useSession } from '../../contexts/session-context';

type NewProjectConfig = {
  newProjectConfig: string;
  onSuccess?: () => void;
};
export const useProjectEditConfigMutation = (namespace: string, project: string, tag: string) => {
  const session = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewProjectConfig) =>
      editProjectConfig(namespace, project, tag, session.jwt || 'NOTAUTHORIZED', data.newProjectConfig),
    onSuccess: (_data, variables) => {
      toast.success('Project config saved successfully');
      queryClient.invalidateQueries({
        queryKey: [namespace, project, tag],
      });

      if (variables.onSuccess) {
        variables.onSuccess();
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
