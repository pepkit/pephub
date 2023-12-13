import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { forkProject } from '../../api/project';
import { extractErrorMessage } from '../../utils/etc';
import { useSession } from '../useSession';

export const useForkMutation = (
  namespace: string,
  project: string,
  tag: string,
  forkTo: string,
  forkName: string,
  forkTag?: string,
  forkDescription?: string,
  onHide?: () => void,
) => {
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const session = useSession();

  return useMutation({
    mutationFn: () =>
      forkProject(namespace, project, tag, session.jwt, {
        forkTo: forkTo,
        forkName: forkName,
        forkTag: forkTag,
        forkDescription: forkDescription,
      }),
    onSuccess: () => {
      toast.success('Project successully forked!');
      queryClient.invalidateQueries({
        queryKey: [forkTo],
      });
      if (onHide) {
        onHide();
      }
      navigate(`/${forkTo}/${forkName.toLowerCase()}?tag=${forkTag}`);
    },
    onError: (err: AxiosError) => {
      // extract out error message if it exists, else unknown
      const errorMessage = extractErrorMessage(err);
      toast.error(`${errorMessage}`, {
        duration: 5000,
      });
    },
  });
};
