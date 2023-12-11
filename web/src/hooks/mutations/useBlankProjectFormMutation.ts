import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { Sample } from '../../../types';
import { submitProjectJSON } from '../../api/namespace';
import { extractError, extractErrorMessage } from '../../utils/etc';

export const useBlankProjectFormMutation = (
  namespace: string,
  projectName: string,
  tag: string,
  isPrivate: boolean,
  description: string,
  config: string,
  pepSchema: string,
  sampleTable: Sample[],
  jwt: string | undefined,
  onSuccess?: () => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      submitProjectJSON(
        {
          namespace: namespace,
          name: projectName,
          tag: tag,
          is_private: isPrivate,
          description: description,
          config: config,
          pep_schema: pepSchema,
          sample_table: sampleTable,
        },
        jwt || '',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [namespace],
      });
      toast.success('Project successfully uploaded!');
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err: AxiosError) => {
      // extract out error message if it exists, else unknown
      const errorMessage = extractErrorMessage(err);
      const error = extractError(err);
      toast.error(`${errorMessage}: ${error}`, {
        duration: 5000,
      });
    },
  });
};
