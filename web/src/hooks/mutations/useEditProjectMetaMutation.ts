import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { m } from 'framer-motion';
import { toast } from 'react-hot-toast';

import { editProjectMetadata } from '../../api/project';
import { useSession } from '../../contexts/session-context';
import { extractError, extractErrorMessage } from '../../utils/etc';

type EditProjectMeta = {
  newDescription?: string;
  newIsPrivate?: boolean;
  newName?: string;
  newTag?: string;
  newSchema?: string;
  isPop?: boolean;
};

export const useEditProjectMetaMutation = (namespace: string, name: string, tag: string) => {
  const queryClient = useQueryClient();
  const session = useSession();

  const mutation = useMutation({
    mutationFn: (data: EditProjectMeta) => {
      const metadata = {
        description: data.newDescription,
        is_private: data.newIsPrivate,
        name: data.newName,
        tag: data.newTag,
        pep_schema: data.newSchema,
        pop: data.isPop,
      };
      return editProjectMetadata(namespace, name, tag, session.jwt, metadata);
    },
    onSuccess: (_data, variables) => {
      const { newName, newTag } = variables;
      toast.success('Project metadata updated successfully.');
      queryClient.invalidateQueries({
        queryKey: [namespace, name, tag],
      });

      if (newName || newTag) {
        window.location.href = `/${namespace}/${newName || name}?tag=${newTag || tag}`;
      }
    },
    onError: (err: AxiosError) => {
      if (err.response?.status === 401) {
        toast.error('You are not authorized to edit this project.');
        return;
      } else {
        // extract out error message if it exists, else unknown
        const errorMessage = extractErrorMessage(err);
        const error = extractError(err);
        toast.error(`${errorMessage}: ${error}`, {
          duration: 5000,
        });
      }
    },
  });

  return {
    ...mutation,
    submit: mutation.mutate,
  };
};
