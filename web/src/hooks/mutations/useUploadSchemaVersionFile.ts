import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

import { createSchemaVersionFiles } from '../../api/schemas';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type UploadSchemaRequest = {
  schemaFile: File | undefined;
  tags: Record<string, string>; 
  version: string;
  release_notes: string;
  contributors: string;
};

export const useUploadSchemaVersionFile = (namespace:string, name:string) => {
  const { jwt } = useSession();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (uploadSchema: UploadSchemaRequest) => {
      if (!uploadSchema.schemaFile) {
        return Promise.reject(new Error('Schema file is required.'));
      }
      return createSchemaVersionFiles(
        namespace,
        name,
        uploadSchema.schemaFile,
        uploadSchema.contributors,
        uploadSchema.tags,
        uploadSchema.version,
        uploadSchema.release_notes,
        jwt,
      );
    },
    onSuccess: () => {
      toast.success('Schema version uploaded successfully');
      queryClient.invalidateQueries({
        queryKey: ['schemas'],
      });
    },
    onError: (error: unknown) => {
      let message = 'Unknown error';
      
      if (error instanceof AxiosError) {
        message = extractErrorMessage(error);
      } else if (error instanceof Error) {
        message = error.message;
      }
      
      toast.error(`Error uploading schema: ${message}`);
    },
  });

  return {
    upload: mutation.mutate,
    ...mutation,
  };
};
