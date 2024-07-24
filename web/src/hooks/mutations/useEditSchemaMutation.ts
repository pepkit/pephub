import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

import { updateSchema } from '../../api/schemas';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type UpdateSchemaPayload = {
  schema?: string;
  description?: string;
  isPrivate?: boolean;
};

export const useEditSchemaMutation = (namespace: string, name: string) => {
  const { jwt } = useSession();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (updates: UpdateSchemaPayload) => {
      return updateSchema(namespace, name, updates, jwt);
    },
    onSuccess: () => {
      toast.success('Schema updated');
      queryClient.invalidateQueries({
        queryKey: ['schema', namespace, name],
      });
    },
    onError(err: AxiosError) {
      const message = extractErrorMessage(err);
      toast.error(`Error editing schema: ${message}`, {
        duration: 5000,
      });
    },
  });

  return {
    update: mutation.mutate,
    ...mutation,
  };
};
