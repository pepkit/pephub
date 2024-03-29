import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { removeStar } from '../../api/namespace';
import { extractErrorMessage } from '../../utils/etc';
import { useSession } from '../useSession';

export const useRemoveStar = (namespace: string, star_namespace: string, star_project: string, star_tag: string) => {
  const session = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => removeStar(namespace, star_namespace, star_project, star_tag, session.jwt || ''),
    onSuccess: () => {
      // queryClient.invalidateQueries({
      //   queryKey: [namespace, 'stars'],
      // });
      queryClient.setQueryData([namespace, 'stars'], (oldData: any) => {
        // NOTE: this wont pull all data from the newly added star, but it will add its identifier it to the list
        return oldData.filter(
          (star: any) => star.namespace !== star_namespace || star.name !== star_project || star.tag !== star_tag,
        );
      });
      queryClient.invalidateQueries({ queryKey: [namespace, 'stars'] });
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
