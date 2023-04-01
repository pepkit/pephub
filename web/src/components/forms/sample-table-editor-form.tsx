import { FC, useState, useEffect } from 'react';
import { readString } from 'react-papaparse';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { useSession } from '../../hooks/useSession';
import { SampleTable } from '../tables/sample-table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editProjectSampleTable } from '../../api/project';
import { toast } from 'react-hot-toast';
import { tableDataToCsvString } from '../../utils/sample-table';

interface Props {
  namespace: string;
  project: string;
  tag: string;
}

export const SampleTableEditorForm: FC<Props> = ({ namespace, project, tag }) => {
  const { jwt } = useSession();

  const { data: projectSamples } = useSampleTable(namespace, project, tag, jwt);

  // track changes
  const [originalSamples, setOriginalSamples] = useState<string>('');
  const [newProjectSamples, setNewProjectSamples] = useState<string>('');

  // reset form
  const resetSampleTable = () => {
    setNewProjectSamples(originalSamples);
  };

  // react-query
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => editProjectSampleTable(namespace, project, tag, jwt, newProjectSamples),
    onSuccess: () => {
      toast.success('Project config saved successfully');
      queryClient.invalidateQueries([namespace, project, tag]);

      // reset values if needed
      if (newProjectSamples !== originalSamples) {
        setOriginalSamples(newProjectSamples);
      }
    },
    onError: (err) => {
      toast.error(`Error saving project config: ${err}`);
    },
  });

  // set original values for project config editor and sample table
  useEffect(() => {
    if (projectSamples) {
      setOriginalSamples(projectSamples);
      setNewProjectSamples(projectSamples);
    }
  }, [projectSamples]);

  // parse sample table csv from server

  return (
    <div>
      <SampleTable
        onChange={(newCsv) => setNewProjectSamples(newCsv)}
        data={newProjectSamples || ''}
        readOnly={false}
      />
      <div>
        <button className="btn btn-outline-dark me-1" onClick={() => resetSampleTable()}>
          Reset
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={newProjectSamples === originalSamples || mutation.isLoading}
          className="btn btn-success me-1"
        >
          {mutation.isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};
