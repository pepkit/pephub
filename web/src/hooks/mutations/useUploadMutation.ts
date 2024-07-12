import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { submitProjectFiles } from '../../api/namespace';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type PepUploadRequest = {
  project: string;
  tag: string;
  isPrivate: boolean;
  description: string;
  files: FileList;
  pepSchema: string;
};

export const useUploadMutation = (namespace: string) => {
  const session = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pepUploadRequest: PepUploadRequest) => {
      const { project, tag, isPrivate, description, files, pepSchema } = pepUploadRequest;
      return submitProjectFiles(
        {
          namespace: namespace,
          name: project,
          tag: tag,
          is_private: isPrivate,
          description: description,
          files: files,
          pep_schema: pepSchema,
        },
        session.jwt || '',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [namespace],
      });
      toast.success('Project successfully uploaded!');
    },
    onError: (err: AxiosError) => {
      // extract out error message if it exists, else unknown
      const errorMessage = extractErrorMessage(err);
      toast.error(`${errorMessage}`, {
        duration: 5000,
      });
    },
  });
};
