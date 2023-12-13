import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { submitProjectFiles } from '../../api/namespace';
import { extractError, extractErrorMessage } from '../../utils/etc';
import { useSession } from '../useSession';

export const useUploadMutation = (
  namespace: string,
  project: string,
  tag: string,
  is_private: boolean,
  description: string,
  files: FileList,
  pep_schema: string,
  onSuccess?: () => void,
) => {
  const session = useSession();
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
        session.jwt || '',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [namespace],
      });
      if (onSuccess) {
        onSuccess();
      }
      toast.success('Project successfully uploaded!');
    },
    onError: (err: AxiosError) => {
      // extract out error message if it exists, else unknown
      const errorMessage = extractErrorMessage(err);
      toast.error(`${errorMessage}`, {
        duration: 5000,
      });
    },
  });
};
