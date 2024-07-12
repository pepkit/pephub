import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { forkProject } from '../../api/project';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type NewFork = {
  forkTo: string;
  forkName: string;
  forkTag?: string;
  forkDescription?: string;
  onHide?: () => void;
};

export const useForkMutation = (namespace: string, project: string, tag: string) => {
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const session = useSession();

  return useMutation({
    mutationFn: (data: NewFork) =>
      forkProject(namespace, project, tag, session.jwt, {
        forkTo: data.forkTo,
        forkName: data.forkName,
        forkTag: data.forkTag,
        forkDescription: data.forkDescription,
      }),
    onSuccess: (_data, variables) => {
      toast.success('Project successully forked!');
      queryClient.invalidateQueries({
        queryKey: [variables.forkTo],
      });
      if (variables.onHide) {
        variables.onHide();
      }
      navigate(`/${variables.forkTo}/${variables.forkName.toLowerCase()}?tag=${variables.forkTag}`);
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
