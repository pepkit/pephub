import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { forkProject } from '../../api/project';

export const useForkMutation = (
  namespace: string,
  project: string,
  tag: string,
  forkTo: string,
  forkName: string,
  forkTag?: string,
  forkDescription?: string,
  jwt?: string,
  onHide?: () => void,
) => {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      forkProject(namespace, project, tag, jwt, {
        forkTo: forkTo,
        forkName: forkName,
        forkTag: forkTag,
        forkDescription: forkDescription,
      }),
    onSuccess: () => {
      toast.success('Project successully forked!');
      queryClient.invalidateQueries([forkTo]);
      if (onHide) {
        onHide();
      }
      navigate(`/${forkTo}/${forkName.toLowerCase()}?tag=${forkTag}`);
    },
    onError: (error: AxiosError) => {
      toast.error(`An error occurred: ${error}`);
    },
  });
};
