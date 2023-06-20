import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editProjectConfig } from '../../api/project';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';

export const useConfigMutation = (
  namespace: string,
  project: string,
  tag: string,
  jwt: string,
  newProjectConfig: any
) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => editProjectConfig(namespace || '', project || '', tag, jwt || '', newProjectConfig),
    onSuccess: (data) => {
      queryClient.invalidateQueries([namespace, project, tag, 'config']);
      toast.success('Successfully updated project config');
    },
    onError: (error: AxiosError) => {
      toast.error(`Error updating project config: ${error}`);
    },
  });

  return mutation;
};
