import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { deleteProject } from '../../api/project';
import { AxiosError } from 'axios';

export const useDelete = (namespace, project, tag, jwt, onHide, redirect) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => deleteProject(namespace, project, tag, jwt || ''),
    onSuccess: () => {
      toast.success('Project successfully deleted.');
      queryClient.invalidateQueries({
        queryKey: [namespace],
      });
      if (redirect) {
        navigate(redirect);
      }
    },
    onError: (error: AxiosError) => {
      toast.error(`There was an error deleting the project: ${error}`);
    },
  });

  const deleteProjectMutation = () => {
    mutation.mutate();
  };

  return { deleteProjectMutation, isLoading: mutation.isLoading };
};
