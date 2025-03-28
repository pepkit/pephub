import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { Sample } from '../../../types';
import { editTotalProject } from '../../api/project';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type TotalProjectChangeMutationProps = {
  config?: string;
  samples?: Sample[];
  subsamples?: Sample[];
};

export const useTotalProjectChangeMutation = (namespace: string, project: string, tag: string, schema: string| undefined = '') => {
  const session = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: TotalProjectChangeMutationProps) => editTotalProject(namespace, project, tag, session.jwt, schema, data),
    onSuccess: (_data, variables) => {
      // perform an optimistic update -- this prevents a flicker
      queryClient.setQueryData([namespace, project, tag, 'samples'], (oldData: any) => {
        return {
          ...oldData,
          items: variables.samples,
        };
      });

      // perform an optimistic update -- this prevents a flicker
      queryClient.setQueryData([namespace, project, tag, 'subsamples'], (oldData: any) => {
        return {
          ...oldData,
          items: variables.subsamples,
        };
      });

      // perform an optimistic update -- this prevents a flicker
      queryClient.setQueryData([namespace, project, tag, 'config'], (oldData: any) => {
        return {
          ...oldData,
          config: variables.config,
        };
      });

      // invalidate the query to refetch the data
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

  return {
    ...mutation,
    submit: mutation.mutate,
  };
};
