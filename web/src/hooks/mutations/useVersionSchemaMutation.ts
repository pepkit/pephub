import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

import { createSchemaVersion } from '../../api/schemas';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type VersionSchema = {
  schemaJson: object;
  tags: Record<string, string>; 
  version: string;
  release_notes: string;
  contributors: string;
};

export const useVersionSchemaMutation = (namespace: string, name: string) => {
  const { jwt } = useSession();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newSchemaVersion: VersionSchema) => {
      return createSchemaVersion(
        namespace,
        name,
        newSchemaVersion.schemaJson,
        newSchemaVersion.contributors,
        newSchemaVersion.tags,
        newSchemaVersion.version,
        newSchemaVersion.release_notes,
        jwt,
      );
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({
        queryKey: ['schemas'],
      });
      toast.success('Schema version created!');
    },
    onError: (err: AxiosError) => {
      const message = extractErrorMessage(err);

      // if message is still an object, JSON.stringify it
      if (typeof message === 'object') {
        toast.error(`Error creating schema version: ${JSON.stringify(message)}`, {
          duration: 5000,
        });
        return;
      }

      toast.error(`Error creating schema version: ${message}`, {
        duration: 5000,
      });
    },
  });

  return {
    ...mutation,
    submit: mutation.mutate,
  };
};
