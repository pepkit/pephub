import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { deleteProject } from '../../api/project';
import { extractError, extractErrorMessage } from '../../utils/etc';
import { useSession } from '../useSession';

export const useDeleteMutation = (
  namespace: string,
  project: string,
  tag: string,
  onHide: () => void,
  redirect: string | undefined,
  onSuccess?: () => void,
) => {
  const session = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => deleteProject(namespace, project, tag, session.jwt || ''),
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
