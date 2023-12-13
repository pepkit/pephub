import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { Sample } from '../../../types';
import { editProjectSubsampleTable } from '../../api/project';
import { useSession } from '../useSession';

export const useSubsampleTableMutation = (
  namespace: string,
  project: string,
  tag: string,
  newProjectSubsamples: Sample[],
) => {
  const session = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      editProjectSubsampleTable(namespace || '', project || '', tag, session.jwt || '', newProjectSubsamples),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [namespace, project, tag, 'subsamples'],
      });
      toast.success('Successfully updated project samples');
    },
    onError: (error: AxiosError) => {
      toast.error(`Failed to update project samples: ${error}`);
    },
  });

  return mutation;
};
