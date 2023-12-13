import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { Sample } from '../../../types';
import { editProjectSampleTable } from '../../api/project';
import { useSession } from '../useSession';

export const useSampleTableMutation = (
  namespace: string,
  project: string,
  tag: string,
  newProjectSamples: Sample[],
) => {
  const session = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => editProjectSampleTable(namespace || '', project || '', tag, session.jwt || '', newProjectSamples),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [namespace, project, tag, 'samples'],
      });
      toast.success('Successfully updated project samples');
    },
    onError: (error: AxiosError) => {
      toast.error(`Failed to update project samples: ${error}`);
    },
  });

  return mutation;
};
