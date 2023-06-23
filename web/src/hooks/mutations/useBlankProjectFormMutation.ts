import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { submitProjectJSON } from '../../api/namespace';

export const useBlankProjectFormMutation = (
  namespace: string,
  projectName: string,
  tag: string,
  isPrivate: boolean,
  description: string,
  config: string,
  pepSchema: string,
  sampleTable: { [key: string]: string }[],
  jwt: string | undefined,
  onSuccess?: () => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      submitProjectJSON(
        {
          namespace: namespace,
          project_name: projectName,
          tag: tag,
          is_private: isPrivate,
          description: description,
          config: config,
          pep_schema: pepSchema,
          sample_table: sampleTable,
        },
        jwt || '',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries([namespace]);
      toast.success('Project successfully uploaded!');
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err: AxiosError) => {
      toast.error(`Error uploading project! ${err}`);
    },
  });
};
