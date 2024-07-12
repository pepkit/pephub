import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

import { deleteProjectHistory } from '../../api/project';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

export const useDeleteProjectHistory = (namespace: string, projectName: string, tag: string = 'default') => {
  const { jwt } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (historyId: number | null) => {
      if (historyId === null) {
        throw new Error('historyId is required');
      }
      return deleteProjectHistory(namespace, projectName, tag, jwt, historyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [namespace, projectName, tag, 'projectHistory'],
      });
    },
    onError: (err: AxiosError) => {
      let msg = extractErrorMessage(err);
      toast.error(msg, { duration: 5000 });
    },
  });
};
