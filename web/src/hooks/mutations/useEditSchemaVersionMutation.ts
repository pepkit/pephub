import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

import { updateSchemaVersion } from '../../api/schemas';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type EditVersionSchema = {
  schemaJson: object | undefined;
  version: string;
  release_notes: string | undefined;
  contributors: string | undefined;
};

export const useEditSchemaVersionMutation = (namespace: string, name: string) => {
  const { jwt } = useSession();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (editSchemaVersion: EditVersionSchema) => {
      return updateSchemaVersion(
        namespace,
        name,
        editSchemaVersion.schemaJson,
        editSchemaVersion.contributors,
        editSchemaVersion.version,
        editSchemaVersion.release_notes,
        jwt,
      );
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({
        queryKey: ['schemas'],
      });
      toast.success('Schema version saved!');
    },
    onError: (err: AxiosError) => {
      const message = extractErrorMessage(err);

      // if message is still an object, JSON.stringify it
      if (typeof message === 'object') {
        toast.error(`Error saving schema version: ${JSON.stringify(message)}`, {
          duration: 5000,
        });
        return;
      }

      toast.error(`Error saving schema version: ${message}`, {
        duration: 5000,
      });
    },
  });

  return {
    ...mutation,
    submit: mutation.mutate,
  };
};
