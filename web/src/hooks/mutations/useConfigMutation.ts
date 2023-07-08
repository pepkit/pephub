import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { editProjectConfig } from '../../api/project';

export const useConfigMutation = (
  namespace: string,
  project: string,
  tag: string,
  jwt: string,
  newProjectConfig: string,
) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => editProjectConfig(namespace || '', project || '', tag, jwt || '', newProjectConfig),
    onSuccess: () => {
      queryClient.invalidateQueries([namespace, project, tag]);
      toast.success('Successfully updated project config');
    },
    onError: (error: AxiosError) => {
      toast.error(`Error updating project config: ${error}`);
    },
  });

  return mutation;
};
