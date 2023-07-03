import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { editProjectSampleTable } from '../../api/project';

export const useSampleTableMutation = (
  namespace: string,
  project: string,
  tag: string,
  jwt: string,
  newProjectSamples: any[],
) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => editProjectSampleTable(namespace || '', project || '', tag, jwt || '', newProjectSamples),
    onSuccess: () => {
      queryClient.invalidateQueries([namespace, project, tag, 'samples']);
      toast.success('Successfully updated project samples');
    },
    onError: (error: AxiosError) => {
      toast.error(`Failed to update project samples: ${error}`);
    },
  });

  return mutation;
};
