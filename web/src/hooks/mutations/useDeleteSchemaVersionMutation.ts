import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

import { deleteSchemaVersion } from '../../api/schemas';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type SchemaVersionToDelete = {
  namespace: string;
  name: string;
  version: string;
};

export const useDeleteSchemaVersionMutation = () => {
  const { jwt } = useSession();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (schema: SchemaVersionToDelete) => {
      return deleteSchemaVersion(schema.namespace, schema.name, schema.version, jwt);
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({
        queryKey: ['schemas'],
      });
      toast.success('Schema version successfully deleted');
    },
    onError: (err: AxiosError) => {
      const message = extractErrorMessage(err);

      // if message is still an object, JSON.stringify it
      if (typeof message === 'object') {
        toast.error(`Error deleting schema version: ${JSON.stringify(message)}`, {
          duration: 5000,
        });
        return;
      }

      toast.error(`Error deleting schema version: ${message}`, {
        duration: 5000,
      });
    },
  });

  return {
    ...mutation,
    delete: mutation.mutate,
  };
};
