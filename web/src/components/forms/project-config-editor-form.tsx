import { FC, useEffect, useState } from 'react';
import { ProjectConfigEditor } from '../project/project-config';
import { useSession } from '../../hooks/useSession';
import { useProjectConfig } from '../../hooks/queries/useProjectConfig';
import { editProjectConfig } from '../../api/project';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useProjectEditConfig } from '../../hooks/mutations/useProjectEditConfig';

interface Props {
  namespace: string;
  project: string;
  tag: string;
}

export const ProjectConfigEditorForm: FC<Props> = ({ namespace, project, tag }) => {
  const { jwt } = useSession();

  const { data: projectConfig } = useProjectConfig(namespace, project, tag, 'yaml', jwt);

  // state
  const [originalConfig, setOriginalConfig] = useState<string>('');
  const [newProjectConfig, setNewProjectConfig] = useState<string>('');

  // form reseter
  const resetProjectConfig = () => {
    setNewProjectConfig(originalConfig);
  };

  const mutation = useProjectEditConfig();

  useEffect(() => {
    if (projectConfig) {
      setOriginalConfig(projectConfig);
      setNewProjectConfig(projectConfig);
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
          disabled={newProjectConfig === originalConfig || mutation.isLoading}
          className="btn btn-success me-1"
        >
          {mutation.isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </>
  );
};
