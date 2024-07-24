import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

import { CreateProjectViewRequest, addProjectView, deleteProjectView } from '../../api/project';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

export const useViewMutations = (namespace: string, project: string, tag: string) => {
  const { jwt } = useSession();
  const queryClient = useQueryClient();

  const addViewMutation = useMutation({
    mutationFn: (createViewRequest: CreateProjectViewRequest) => {
      return addProjectView(namespace, project, tag, jwt, createViewRequest);
    },
    onSuccess: () => {
      toast.success('View successfully added!');
      queryClient.invalidateQueries({
        queryKey: [namespace, project, tag, 'views'],
      });
    },
    onError: (err: AxiosError) => {
      const errorMessage = extractErrorMessage(err);
      toast.error(`${errorMessage}`, {
        duration: 5000,
      });
    },
  });

  const removeViewMutation = useMutation({
    mutationFn: (viewName: string | undefined | null) => {
      if (!viewName) {
        throw new Error('View name is not provided');
      }
      return deleteProjectView(namespace, project, tag, viewName, jwt);
    },
    onSuccess: () => {
      toast.success('View successfully removed!');
      queryClient.invalidateQueries({
        queryKey: [namespace, project, tag, 'views'],
      });
    },
    onError: (err: AxiosError) => {
      const errorMessage = extractErrorMessage(err);
      toast.error(`${errorMessage}`, {
        duration: 5000,
      });
    },
  });

  return {
    addViewMutation,
    removeViewMutation,
  };
};
