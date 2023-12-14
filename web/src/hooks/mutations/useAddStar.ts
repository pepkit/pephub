import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { starRepository } from '../../api/namespace';
import { extractErrorMessage } from '../../utils/etc';
import { useSession } from '../useSession';

export const useAddStar = (namespace: string, star_namespace: string, star_project: string, star_tag: string) => {
  const session = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => starRepository(namespace, star_namespace, star_project, star_tag, session.jwt || ''),
    onSuccess: () => {
      //   toast.success('Project successfully deleted.');
      queryClient.invalidateQueries({
        queryKey: [namespace, 'stars'],
      });
    },
    onError: (err: AxiosError) => {
      // extract out error message if it exists, else unknown
      const errorMessage = extractErrorMessage(err);
      toast.error(`${errorMessage}`, {
        duration: 5000,
      });
    },
  });

  return mutation;
};
