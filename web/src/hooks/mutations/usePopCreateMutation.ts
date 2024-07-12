import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { Sample } from '../../../types';
import { submitPop } from '../../api/namespace';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type NewPop = {
  isPrivate: boolean;
  description: string;
  pepSchema: string;
  peps: Sample[];
  onSuccess?: () => void;
};

export const usePopCreateMutation = (namespace: string, projectName: string, tag: string) => {
  const session = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newPop: NewPop) =>
      submitPop(
        {
          namespace: namespace,
          name: projectName,
          tag: tag,
          is_private: newPop.isPrivate,
          description: newPop.description,
          pep_schema: newPop.pepSchema,
          peps: newPop.peps,
        },
        session.jwt || '',
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [namespace],
      });
      toast.success('Project successfully uploaded!');
      if (variables.onSuccess) {
        variables.onSuccess();
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
