import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

import { createSchemaVersion } from '../../api/schemas';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';
import { ValidationError } from '../../../types';

type VersionSchema = {
  schemaJson: object;
  tags: Record<string, string>; 
  version: string;
  release_notes: string;
  contributors: string;
};

export const useCreateSchemaVersionMutation = (namespace: string, name: string) => {
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
    
      // If the error is already a string, show it directly
      if (typeof message === 'string') {
        toast.error(`Error saving schema version: ${message}`, {
          duration: 5000,
        });
        return;
      }
    
      // If it's an array of validation errors (common format for FastAPI/Pydantic)
      if (Array.isArray(message)) {
        try {
          const errorMessages = (message as ValidationError[]).map((error: ValidationError) => {

            // For JSON syntax errors, try to to parse and find the issue
            if (error.type === 'dict_type' && error.input) {
              try {
                JSON.parse(error.input);
              } catch (jsonError: any) {
                return `JSON syntax error: ${jsonError.message}`;
              }
            }
            
            return error.msg;
            }).join('\n');
            
            toast.error(`Error creating schema version: ${errorMessages}`, {
              duration: 8000,
            });
          return;
        } catch (parseError) {
          toast.error('Error creating schema version.', {
            duration: 5000,
          });
        }
      }
    
      toast.error(`Error creating schema version: ${JSON.stringify(message)}`, {
        duration: 5000,
      });
    }
  });

  return {
    ...mutation,
    submit: mutation.mutate,
  };
};
