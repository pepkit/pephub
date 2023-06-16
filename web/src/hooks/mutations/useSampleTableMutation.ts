import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editProjectSampleTable } from '../../api/project';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { tableDataToCsvString, sampleListToArrays } from '../../utils/sample-table';

interface SampleTableMutationOptions {
  onSuccess?: () => void;
  onError?: (error: AxiosError) => void;
}

export const useSampleTableMutation = (
  namespace: string,
  project: string,
  tag: string,
  jwt: string,
  newProjectSamples: any[],
  options: SampleTableMutationOptions = {}
) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError = (error: AxiosError) => {
    toast.error(`Error updating project samples: ${error}`);
  } } = options;

  const mutation = useMutation({
    mutationFn: () =>
      editProjectSampleTable(
        namespace || '',
        project || '',
        tag,
        jwt || '',
        tableDataToCsvString(sampleListToArrays(newProjectSamples)),
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries([namespace, project, tag, 'samples']);
      toast.success('Successfully updated project samples');
    },
    onError: (error: AxiosError) => {
      toast.error(`Failed to update project samples: ${error}`);
    },
  });

  return mutation;
};
