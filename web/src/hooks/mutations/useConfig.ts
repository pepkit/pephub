import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editProjectConfig } from '../../api/project';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';

interface ConfigMutationOptions {
  onSuccess?: () => void;
  onError?: (error: AxiosError) => void;
}

export const useConfig = (
  namespace: string,
  project: string,
  tag: string,
  jwt: string,
  newProjectConfig: any,
  options: ConfigMutationOptions = {}
) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError = (error: AxiosError) => {
    toast.error(`Error updating project samples: ${error}`);
  } } = options;

  const mutation = useMutation({
    mutationFn: () => editProjectConfig(namespace || '', project || '', tag, jwt || '', newProjectConfig),
    onSuccess: (data) => {
      queryClient.invalidateQueries([namespace, project, tag, 'config']);
      toast.success('Successfully updated project config');
    },
    onError,
  });

  return mutation;
};
