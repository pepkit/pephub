import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

export const useForkMutation = (onSubmit, watch, onHide) => {
  const navigate = useNavigate();

  const projectName = watch('project');
  const projectNamespace = watch('namespace');
  const projectTag = watch('tag');

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: onSubmit,
    onSuccess: () => {
      toast.success('Project successully forked!');
      queryClient.invalidateQueries([projectNamespace]);
      onHide();
      navigate(`/${projectNamespace}/${projectName.toLowerCase()}?tag=${projectTag}`);
    },
    onError: (error) => {
      toast.error(`An error occurred: ${error}`);
    },
});
};
