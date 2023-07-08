import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { deleteProject } from '../../api/project';

export const useDeleteMutation = (
  namespace: string,
  project: string,
  tag: string,
  jwt: string | undefined,
  onHide: () => void,
  redirect: string | undefined,
  onSuccess?: () => void,
) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => deleteProject(namespace, project, tag, jwt || ''),
    onSuccess: () => {
      toast.success('Project successfully deleted.');
      // need to wait for database to update before redirecting
      if (redirect) {
        setTimeout(() => {
          navigate(redirect);
        }, 500);
      }
      onHide();
      if (onSuccess) {
        onSuccess();
      }
      queryClient.invalidateQueries({
        queryKey: [namespace],
      });
    },
    onError: (error: AxiosError) => {
      toast.error(`There was an error deleting the project: ${error}`);
    },
  });

  return { mutation, isLoading: mutation.isLoading };
};
