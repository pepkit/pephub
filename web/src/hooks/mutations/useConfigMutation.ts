import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { editProjectConfig } from '../../api/project';
import { extractError, extractErrorMessage } from '../../utils/etc';


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
    onError: (err: AxiosError) => {
      // extract out error message if it exists, else unknown
      const errorMessage = extractErrorMessage(err);
      const error = extractError(err);
      toast.error(`${errorMessage}: ${error}`, {
        duration: 5000,
      });
    },
  });

  return mutation;
};
