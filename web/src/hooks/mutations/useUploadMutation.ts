import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { submitProjectFiles } from '../../api/namespace';

export const useUploadMutation = (
  namespace: string,
  project: string,
  tag: string,
  is_private: boolean,
  description: string,
  files: FileList,
  pep_schema: string,
  jwt?: string,
  onSuccess?: () => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      submitProjectFiles(
        {
          namespace: namespace,
          name: project,
          tag: tag,
          is_private: is_private,
          description: description,
          files: files,
          pep_schema: pep_schema,
        },
        jwt || '',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries([namespace]);
      if (onSuccess) {
        onSuccess();
      }
      toast.success('Project successfully uploaded!');
    },
    onError: (err: AxiosError) => {
      toast.error(`Error uploading project! ${err}`);
    },
  });
};
