import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';

export const useBlankProjectForm = (onSubmit, onSuccess, onError) => {
  return useMutation({
    mutationFn: onSubmit,
    onSuccess: () => {
      onSuccess();
      toast.success('Project successfully uploaded!');
    },
    onError: (err: AxiosError) => {
      toast.error(`Error uploading project! ${err}`);
    },
  });
};
