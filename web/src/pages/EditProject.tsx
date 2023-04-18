import { useParams, useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/page-layout';
import { Tab, Tabs } from 'react-bootstrap';
import { ProjectMetaEditForm } from '../components/forms/edit-project-meta';
import { useProject } from '../hooks/queries/useProject';
import { useSession } from '../hooks/useSession';
import { ProjectConfigEditorForm } from '../components/forms/project-config-editor-form';
import { SampleTableEditorForm } from '../components/forms/sample-table-editor-form';

export const EditProjectPage = () => {
  const { jwt } = useSession();

  const { namespace, project } = useParams();
  let [searchParams] = useSearchParams();

  const tag = searchParams.get('tag') || 'default';

  const { data: projectData, isLoading } = useProject(namespace, project, tag, jwt);

  // loading
  if (isLoading) {
    return (
      <PageLayout title="Edit Project">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
          <p className="text-muted fst-italic">Loading project data...</p>
        </div>
      </PageLayout>
    );
    // ensure project and namespace are not empty strings
  } else if (!namespace || !project || !projectData) {
    return (
      <PageLayout title="Edit Project">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
          <p className="text-muted fst-italic">Project not found</p>
        </div>
      </PageLayout>
    );
    // render page - everything is here
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
                namespace={namespace}
                name={projectData.name}
                description={projectData.description}
                tag={projectData.tag || 'default'}
                is_private={projectData?.is_private || false}
              />
            </div>
          </Tab>
          <Tab eventKey="Config" title="Config">
            <div className="p-2 border border-top-0 rounded-bottom">
              <ProjectConfigEditorForm namespace={namespace} project={project} tag={tag || 'default'} />
            </div>
          </Tab>
          <Tab eventKey="samples" title="Sample Table">
            <div className="p-2 border border-top-0 rounded-bottom">
              <SampleTableEditorForm namespace={namespace} project={project} tag={tag || 'default'} />
            </div>
          </Tab>
        </Tabs>
      </PageLayout>
    );
  }
};
