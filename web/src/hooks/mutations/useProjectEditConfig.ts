import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editProjectConfig } from '../../api/project';
import { AxiosError } from 'axios';

interface EditProjectConfigMutationOptions {
  namespace: string;
  project: string;
  tag: string;
  jwt: string;
  newProjectConfig: string;
  originalConfig: string;
  setOriginalConfig: React.Dispatch<React.SetStateAction<string>>;
  onSuccess?: () => void;
  onError?: (error: AxiosError) => void;
}

const useEditProjectConfigMutation = (): ((options: EditProjectConfigMutationOptions) => void) => {
  const queryClient = useQueryClient();

  return useMutation(async (options: EditProjectConfigMutationOptions) => {
    const { namespace, project, tag, jwt, newProjectConfig, originalConfig, setOriginalConfig, onSuccess, onError } = options;

    try {
      const response = await editProjectConfig(namespace, project, tag, jwt, newProjectConfig);

      if (onSuccess) {
        onSuccess();
      }

      return response;
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  }, {
    onSuccess: (data, variables) => {
      const { namespace, project, tag } = variables;
      toast.success('Project config saved successfully');
      queryClient.invalidateQueries([namespace, project, tag]);

      // reset values if needed
      if (variables.newProjectConfig !== variables.originalConfig) {
        variables.setOriginalConfig(variables.newProjectConfig);
      }
    },
    onError: (error) => {
      // if there exists a response body, render that
      if (error.response?.data) {
        toast.error(JSON.stringify(error.response.data, null, 2));
      } else {
        toast.error(`Error saving project config: ${error}`);
      }
    },
  });
};

export default useEditProjectConfigMutation;
