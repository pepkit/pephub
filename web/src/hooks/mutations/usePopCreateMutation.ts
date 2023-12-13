import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { Sample } from '../../../types';
import { submitPop, submitProjectJSON } from '../../api/namespace';
import { extractErrorMessage } from '../../utils/etc';
import { useSession } from '../useSession';

export const usePopCreateMutation = (
  namespace: string,
  projectName: string,
  tag: string,
  isPrivate: boolean,
  description: string,
  pepSchema: string,
  peps: Sample[],
  onSuccess?: () => void,
) => {
  const session = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      submitPop(
        {
          namespace: namespace,
          name: projectName,
          tag: tag,
          is_private: isPrivate,
          description: description,
          pep_schema: pepSchema,
          peps: peps,
        },
        session.jwt || '',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [namespace],
      });
      toast.success('Project successfully uploaded!');
      if (onSuccess) {
        onSuccess();
      }
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
