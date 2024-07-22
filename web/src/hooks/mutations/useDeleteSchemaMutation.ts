import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

import { deleteSchema } from '../../api/schemas';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type SchemaToDelete = {
  namespace: string;
  name: string;
};

export const useDeleteSchemaMutation = () => {
  const { jwt } = useSession();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (schema: SchemaToDelete) => {
      return deleteSchema(schema.namespace, schema.name, jwt);
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({
        queryKey: ['schemas'],
      });
      toast.success('Schema successfully deleted');
    },
    onError: (err: AxiosError) => {
      const message = extractErrorMessage(err);

      // if message is still an object, JSON.stringify it
      if (typeof message === 'object') {
        toast.error(`Error deleting schema: ${JSON.stringify(message)}`, {
          duration: 5000,
        });
        return;
      }

      toast.error(`Error deleting schema: ${message}`, {
        duration: 5000,
      });
    },
  });

  return {
    ...mutation,
    delete: mutation.mutate,
  };
};
