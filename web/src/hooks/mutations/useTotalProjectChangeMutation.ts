import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { Sample } from '../../../types';
import { editTotalProject } from '../../api/project';
import { extractError, extractErrorMessage } from '../../utils/etc';

interface TotalProjectChangeMutationProps {
  config?: string;
  samples?: Sample[];
  subsamples?: Sample[];
}

export const useTotalProjectChangeMutation = (
  namespace: string,
  project: string,
  tag: string,
  jwt: string,
  data: TotalProjectChangeMutationProps,
) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => editTotalProject(namespace || '', project || '', tag, jwt || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [namespace, project, tag],
      });
      toast.success('Successfully updated the project!');
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
