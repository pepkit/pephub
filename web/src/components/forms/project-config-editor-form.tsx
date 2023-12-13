import { FC, useEffect, useState } from 'react';

import { useProjectEditConfigMutation } from '../../hooks/mutations/useProjectEditConfigMutation';
import { useProjectConfig } from '../../hooks/queries/useProjectConfig';
import { useSession } from '../../hooks/useSession';
import { ProjectConfigEditor } from '../project/project-config';

interface Props {
  namespace: string;
  project: string;
  tag: string;
}

export const ProjectConfigEditorForm: FC<Props> = ({ namespace, project, tag }) => {
  const { jwt } = useSession();

  const { data: projectConfig } = useProjectConfig(namespace, project, tag);

  // state
  const [originalConfig, setOriginalConfig] = useState<string>('');
  const [newProjectConfig, setNewProjectConfig] = useState<string>('');

  // form reseter
  const resetProjectConfig = () => {
    setNewProjectConfig(originalConfig);
  };

  const onSuccess = () => {
    if (newProjectConfig !== originalConfig) {
      setOriginalConfig(newProjectConfig);
    }
  };

  const mutation = useProjectEditConfigMutation(namespace, project, tag, newProjectConfig, onSuccess);

  useEffect(() => {
    if (projectConfig) {
      setOriginalConfig(projectConfig.config);
      setNewProjectConfig(projectConfig.config);
    }
  }, [projectConfig]);

  return (
    <>
      <ProjectConfigEditor setValue={(v) => setNewProjectConfig(v)} value={newProjectConfig || ''} />
      <div className="mt-2">
        <button className="btn btn-outline-dark me-1" onClick={() => resetProjectConfig()}>
          Reset
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={newProjectConfig === originalConfig || mutation.isPending}
          className="btn btn-success me-1"
        >
          {mutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </>
  );
};
