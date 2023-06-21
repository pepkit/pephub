import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editProjectConfig } from '../../api/project';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';

export const useProjectEditConfigMutation = (
  namespace: string,
  project: string,
  tag: string,
  jwt: string | undefined,
  newProjectConfig: string,
  onSuccess?: () => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => editProjectConfig(namespace, project, tag, jwt || '', newProjectConfig),
    onSuccess: () => {
      toast.success('Project config saved successfully');
      queryClient.invalidateQueries([namespace, project, tag]);

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