import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export const useEditProjectMetaMutation = (
  handleSubmit: () => Promise<any>,
  resetForm: () => void,
  toast: any,
  queryClient: any,
  namespace: string,
  name: string,
  tag: string,
  onSuccessfulSubmit: () => void,
  onFailedSubmit: () => void,
  newTag: string,
  newName: string
) => {
  return useMutation({
    mutationFn: handleSubmit,
    onSuccess: () => {
      resetForm({}, { keepValues: true });
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
