import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

import { Sample } from '../../../types';
import { submitProjectJSON } from '../../api/namespace';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

type NewBlankProject = {
  projectName: string;
  tag: string;
  isPrivate: boolean;
  description: string;
  config: string;
  pepSchema: string;
  sampleTable: Sample[];
  onSuccess?: () => void;
};

export const useBlankProjectFormMutation = (namespace: string) => {
  const session = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: NewBlankProject) => {
      const { projectName, tag, isPrivate, description, config, pepSchema, sampleTable } = data;
      return submitProjectJSON(
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
        session.jwt || '',
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [namespace],
      });
      toast.success('Project successfully uploaded!');
      if (variables.onSuccess) {
        variables.onSuccess();
      }
    },
    onError: (err: AxiosError) => {
      // extract out error message if it exists, else unknown
      const errorMessage = extractErrorMessage(err);
      toast.error(`${errorMessage}`, {
        duration: 5000,
      });
    },
  });

  return {
    ...mutation,
    submit: mutation.mutate,
  };
};
