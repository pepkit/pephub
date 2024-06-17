import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { removeStar } from '../../api/namespace';
import { extractErrorMessage } from '../../utils/etc';
import { useSession } from '../useSession';

type RemoveStarMutation = {
  namespaceToRemove: string;
  projectNameToRemove: string;
  projectTagToRemove: string;
};

export const useRemoveStar = (namespaceToAddTo: string) => {
  const session = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: RemoveStarMutation) => {
      const { namespaceToRemove, projectNameToRemove, projectTagToRemove } = data;
      return removeStar(
        namespaceToAddTo,
        namespaceToRemove,
        projectNameToRemove,
        projectTagToRemove,
        session.jwt || '',
      );
    },
    onSuccess: ({ data }) => {
      debugger;
      const { registry } = data;
      const namespaceToRemove = registry.split('/')[0];
      const projectNameToRemove = registry.split('/')[1];
      const projectTagToRemove = registry.split(':')[1];

      queryClient.setQueryData([namespaceToAddTo, 'stars'], (oldData: any) => {
        // NOTE: this wont pull all data from the newly added star, but it will add its identifier it to the list
        return oldData.filter(
          (star: any) =>
            star.namespace !== namespaceToRemove ||
            star.name !== projectNameToRemove ||
            star.tag !== projectTagToRemove,
        );
      });
      queryClient.invalidateQueries({ queryKey: [namespaceToAddTo, 'stars'] });
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
