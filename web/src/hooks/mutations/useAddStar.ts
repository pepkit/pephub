import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { StarsResponse, starProject } from '../../api/namespace';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type AddStarMutation = {
  namespaceToStar: string;
  projectNameToStar: string;
  projectTagToStar: string;
};

export const useAddStar = (addToNamespace: string | undefined | null) => {
  const session = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: AddStarMutation) => {
      if (!addToNamespace) {
        throw new Error('Please ensure that you are logged in before starring a project');
      }
      const { namespaceToStar, projectNameToStar, projectTagToStar } = data;
      if (addToNamespace === '') {
        toast.error('Please ensure that you are logged in before starring a project');
      }
      return starProject(addToNamespace, namespaceToStar, projectNameToStar, projectTagToStar, session.jwt || '');
    },
    onSuccess: ({ data }) => {
      const { namespace, registry_path } = data;

      const namespaceToStar = registry_path.split('/')[0];
      const projectNameToStar = registry_path.split('/')[1];
      const projectTagToStar = registry_path.split(':')[1];

      queryClient.setQueryData([addToNamespace, 'stars'], (oldData: StarsResponse['results']) => {
        // NOTE: this wont pull all data from the newly added star, but it will add its identifier it to the list
        return [...oldData, { namespace: namespaceToStar, name: projectNameToStar, tag: projectTagToStar }];
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

  return {
    ...mutation,
    addStar: mutation.mutate,
  };
};
