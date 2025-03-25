import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

import { createNewSchemaFiles } from '../../api/schemas';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type UploadSchemaRequest = {
  namespace: string;
  name: string;
  description: string;
  schemaFile: File | undefined;
  isPrivate: boolean;
  tags: Record<string, string>; 
  maintainers: string;
  version: string;
  release_notes: string;
  lifecycle_stage: string;
  contributors: string;
};

export const useUploadSchemaFile = () => {
  const { jwt } = useSession();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (uploadSchema: UploadSchemaRequest) => {
      if (!uploadSchema.schemaFile) {
        return Promise.reject(new Error('Schema file is required.'));
      }
      return createNewSchemaFiles(
        uploadSchema.namespace,
        uploadSchema.name,
        uploadSchema.description,
        uploadSchema.schemaFile,
        uploadSchema.isPrivate,
        uploadSchema.contributors,
        uploadSchema.maintainers,
        uploadSchema.tags,
        uploadSchema.version,
        uploadSchema.release_notes,
        uploadSchema.lifecycle_stage,
        jwt,
      );
    },
    onSuccess: () => {
      toast.success('Schema uploaded successfully');
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
