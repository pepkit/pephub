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
  const { newName, newTag } = data;

  // create the metadata object to pass to the api call
  const metadata = {
    description: data.newDescription,
    is_private: data.newIsPrivate,
    name: data.newName,
    tag: data.newTag,
    pep_schema: data.newSchema,
  };

  return useMutation({
    mutationFn: () => editProjectMetadata(namespace, name, tag, jwt, metadata),
    onSuccess: () => {
      toast.success('Project metadata updated successfully.');
      queryClient.invalidateQueries([namespace, name, tag]);
      onSuccessfulSubmit();

      if (newName || newTag) {
        window.location.href = `/${namespace}/${newName || name}?tag=${newTag || tag}`;
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
