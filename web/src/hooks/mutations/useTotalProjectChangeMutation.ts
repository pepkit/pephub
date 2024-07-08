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

export const useTotalProjectChangeMutation = (namespace: string, project: string, tag: string) => {
  const session = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: TotalProjectChangeMutationProps) => editTotalProject(namespace, project, tag, session.jwt, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [namespace, project, tag],
      });

      // set the project config
      queryClient.setQueryData([namespace, project, tag, 'config'], (_oldData: string) => {
        return {
          config: variables.config,
        };
      });

      // set the sample table
      queryClient.setQueryData([namespace, project, tag, 'samples'], (_oldData: Sample[]) => {
        return {
          count: variables.samples?.length,
          items: variables.samples,
        };
      });

      // set the subsample table
      queryClient.setQueryData([namespace, project, tag, 'subsamples'], (_oldData: Sample[]) => {
        return {
          count: variables.subsamples?.length,
          items: variables.subsamples,
        };
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
