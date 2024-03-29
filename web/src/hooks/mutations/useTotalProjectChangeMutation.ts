import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { Sample } from '../../../types';
import { editTotalProject } from '../../api/project';
import { extractErrorMessage } from '../../utils/etc';
import { useSession } from '../useSession';

interface TotalProjectChangeMutationProps {
  config?: string;
  samples?: Sample[];
  subsamples?: Sample[];
}

export const useTotalProjectChangeMutation = (
  namespace: string,
  project: string,
  tag: string,
  data: TotalProjectChangeMutationProps,
) => {
  const session = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => editTotalProject(namespace || '', project || '', tag, session.jwt || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [namespace, project, tag],
      });
      toast.success('Successfully updated the project!');
    },
    onError: (err: AxiosError) => {
      // extract out error message if it exists, else unknown
      const errorMessage = extractErrorMessage(err);
      toast.error(`${errorMessage}`, {
        duration: 5000,
      });
    },
  });

  return mutation;
};
