import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { Sample } from '../../../types';
import { editTotalProject } from '../../api/project';

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
      queryClient.invalidateQueries([namespace, project, tag, data]);
      toast.success('Successfully updated the project!');
    },
    onError: (error: AxiosError) => {
      toast.error(`Failed to update project: ${error}`);
    },
  });

  return mutation;
};

