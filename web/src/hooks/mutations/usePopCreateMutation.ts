import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { Sample } from '../../../types';
import { submitPop } from '../../api/namespace';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type NewPop = {
  projectName: string;
  tag: string;
  isPrivate: boolean;
  description: string;
  pepSchema: string;
  peps: Sample[];
};

export const usePopCreateMutation = (namespace: string) => {
  const session = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newPop: NewPop) =>
      submitPop(
        {
          namespace: namespace,
          name: newPop.projectName,
          tag: newPop.tag,
          is_private: newPop.isPrivate,
          description: newPop.description,
          pep_schema: newPop.pepSchema,
          peps: newPop.peps,
        },
        session.jwt || '',
      ),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({
        queryKey: [namespace],
      });
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

  return {
    ...mutation,
    submit: mutation.mutate,
  };
};
