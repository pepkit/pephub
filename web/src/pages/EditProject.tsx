import { useEffect, useState } from 'react';
import { readString } from 'react-papaparse';
import { useParams, useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/page-layout';
import { Tab, Tabs } from 'react-bootstrap';
import { ProjectMetaEditForm } from '../components/forms/edit-project-meta';
import { useProject } from '../hooks/queries/useProject';
import { useSession } from '../hooks/useSession';
import { ProjectConfigEditor } from '../components/project/project-config';
import { SampleTable } from '../components/tables/sample-table';
import { useSampleTable } from '../hooks/queries/useSampleTable';
import { useProjectConfig } from '../hooks/queries/useProjectConfig';

export const EditProjectPage = () => {
  const { jwt } = useSession();

  const { namespace, project } = useParams();
  let [searchParams] = useSearchParams();

  const tag = searchParams.get('tag') || 'default';

  const { data: projectSamples } = useSampleTable(namespace, project, tag, jwt);
  const { data: projectConfig } = useProjectConfig(namespace, project, tag, 'yaml', jwt);
  const { data: projectData, isLoading } = useProject(namespace, project, tag, jwt);

  const [sampleTableHeaders, setSampleTableHeaders] = useState<string[]>([]);
  const [sampleTableData, setSampleTableData] = useState<any[][]>([]);

  // parse sample table csv from server
  useEffect(() => {
    if (projectSamples) {
      readString(projectSamples, {
        worker: true,
        complete: (results) => {
          // ts-ignore
          const data = results.data as any[][];
          setSampleTableHeaders(data[0]);
          setSampleTableData(data.slice(1));
        },
      });
    }
  }, [projectSamples]);

  if (isLoading) {
    return (
      <PageLayout title="Edit Project">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
          <p className="text-muted fst-italic">Loading project data...</p>
        </div>
      </PageLayout>
    );
  } else {
    return (
      <PageLayout title="Edit Project">
        <a href={`/${namespace}/${project}?tag=${tag}`}>
          <button className="btn btn-sm btn-outline-dark">
            <i className="bi bi-arrow-bar-left me-1"></i>
            Back to project
          </button>
        </a>
        <Tabs transition={false} defaultActiveKey="meta" className="mt-3">
          <Tab eventKey="meta" title="Metadata">
            <div className="p-2 border border-top-0 rounded-bottom">
              <ProjectMetaEditForm
                namespace={namespace || ''}
                name={projectData?.name || ''}
                description={projectData?.description || ''}
                tag={projectData?.tag || 'default'}
                is_private={projectData?.is_private || false}
              />
            </div>
          </Tab>
          <Tab eventKey="Config" title="Config">
            <div className="p-2 border border-top-0 rounded-bottom">
              <ProjectConfigEditor value={projectConfig || ''} />
            </div>
          </Tab>
          <Tab eventKey="samples" title="Sample Table">
            <div className="p-2 border border-top-0 rounded-bottom">
              <SampleTable headers={sampleTableHeaders} rows={sampleTableData} />
            </div>
          </Tab>
        </Tabs>
      </PageLayout>
    );
  }
};
