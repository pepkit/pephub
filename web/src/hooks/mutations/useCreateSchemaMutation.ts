import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

import { createNewSchema } from '../../api/schemas';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type NewSchema = {
  namespace: string;
  name: string;
  description: string;
  isPrivate: boolean;
  schema: string;
};

export const useCreateSchemaMutation = () => {
  const { jwt } = useSession();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newSchema: NewSchema) => {
      return createNewSchema(
        newSchema.namespace,
        newSchema.name,
        newSchema.description,
        newSchema.isPrivate,
        newSchema.schema,
        jwt,
      );
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({
        queryKey: ['schemas'],
      });
      toast.success('Schema successfully created!');
    },
    onError: (err: AxiosError) => {
      const message = extractErrorMessage(err);

      // if message is still an object, JSON.stringify it
      if (typeof message === 'object') {
        toast.error(`Error creating schema: ${JSON.stringify(message)}`, {
          duration: 5000,
        });
        return;
      }

      toast.error(`Error creating schema: ${message}`, {
        duration: 5000,
      });
    },
  });

  return {
    ...mutation,
    submit: mutation.mutate,
  };
};
