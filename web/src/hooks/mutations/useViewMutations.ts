import { useMutation } from '@tanstack/react-query';

export const useViewMutations = (namespace: string, project: string, tag: string) => {
  const addViewMutation = useMutation({
    mutationFn: () => {},
    onSuccess: () => {},
    onError: () => {},
  });

  const removeViewMutation = useMutation({
    mutationFn: () => {},
    onSuccess: () => {},
    onError: () => {},
  });

  return {
    addViewMutation,
    removeViewMutation,
  };
};
