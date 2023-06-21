import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { editProjectMetadata } from '../../api/project';

export const useEditProjectMetaMutation = (
  namespace: string,
  name: string,
  tag: string,
  jwt: string | null,
  onSuccessfulSubmit: () => void,
  onFailedSubmit: () => void,
  data: {
    newDescription?: string;
    newIsPrivate?: boolean;
    newName?: string;
    newTag?: string;
    newSchema?: string;
  },
) => {
  const queryClient = useQueryClient();

  // destructuring the data object
  const { newIsPrivate, newName, newTag } = data;

  return useMutation({
    mutationFn: () => editProjectMetadata(namespace, name, tag, jwt, { is_private: newIsPrivate, ...data }),
    onSuccess: () => {
      toast.success('Project metadata updated successfully.');
      queryClient.invalidateQueries([namespace, name, tag]);
      onSuccessfulSubmit();

      if (newTag !== tag || newName !== name) {
        window.location.href = `/${namespace}/${newName}?tag=${newTag}`;
      }
    },
    onError: (error: AxiosError) => {
      if (error.response?.status === 401) {
        toast.error('You are not authorized to edit this project.');
        return;
      }
      toast.error(`There was an error updating project metadata: ${error}`);
      onFailedSubmit();
    },
  });
};
