import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export const useUpload = (onSubmit, onSuccess, onError) => {
  return useMutation({
    mutationFn: onSubmit,
    onSuccess: () => {
      onSuccess();
      toast.success('Project successfully uploaded!');
    },
    onError: (err) => {
      onError(err);
      toast.error(`Error uploading project! ${err}`);
    },
  });
};
