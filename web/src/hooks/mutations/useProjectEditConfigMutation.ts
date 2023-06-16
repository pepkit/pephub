import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editProjectConfig } from '../../api/project';
import { AxiosError } from 'axios';


export const useProjectEditConfigMutation = (namespace, project, tag, jwt, newProjectConfig, originalConfig, setOriginalConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => editProjectConfig(namespace, project, tag, jwt, newProjectConfig),

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
