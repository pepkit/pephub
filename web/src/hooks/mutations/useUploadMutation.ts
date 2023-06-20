import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';

export const useUploadMutation = (onSubmit: (data: Options) => void, onSuccess: () => void, onError: (error: AxiosError) => void) => {
  return useMutation({
    mutationFn: onSubmit,
    onSuccess: () => {
      toast.success('Project successfully uploaded!');
    },
    onError: (err: AxiosError) => {
      toast.error(`Error uploading project! ${err}`);
    },
  });
};
