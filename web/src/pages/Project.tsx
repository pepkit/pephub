import { FC, forwardRef, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { ProjectPageheaderPlaceholder } from '../components/placeholders/project-page-header';
import { useParams, useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/page-layout';
import { useSession } from '../hooks/useSession';
import { canEdit } from '../utils/permissions';
import { dateStringToDate, dateStringToDateTime } from '../utils/dates';
import { DeletePEPModal } from '../components/modals/delete-pep';
import { ForkPEPModal } from '../components/modals/fork-pep';
import { useProject } from '../hooks/queries/useProject';
import { SampleTable } from '../components/tables/sample-table';
import { useSampleTable } from '../hooks/queries/useSampleTable';
import { ProjectConfigEditor } from '../components/project/project-config';
import { useProjectConfig } from '../hooks/queries/useProjectConfig';
import { ProjectAPIEndpointsModal } from '../components/modals/project-api-endpoints';
import { CompatibilityModal } from '../components/modals/compatibility-modal';
import { Breadcrumb } from 'react-bootstrap';
import { EditMetaMetadataModal } from '../components/modals/edit-meta-metadata';

type ProjectView = 'samples' | 'subsamples' | 'config';

export const ProjectPage: FC = () => {
  const { user, jwt } = useSession();

  const { namespace, project } = useParams();
  let [searchParams] = useSearchParams();

  const tag = searchParams.get('tag') || 'default';

  const { data: projectInfo, isLoading: projectInfoIsLoading } = useProject(namespace, project || '', tag, jwt);
  const { data: projectSamples } = useSampleTable(namespace, project, tag, jwt);
  const { data: projectConfig, isLoading: projectConfigIsLoading } = useProjectConfig(
    namespace,
    project || '',
    tag,
    'yaml',
    jwt,
  );

  // state
  const [projectView, setProjectView] = useState<ProjectView>('samples');
  const [showDeletePEPModal, setShowDeletePEPModal] = useState(false);
  const [showForkPEPModal, setShowForkPEPModal] = useState(false);
  const [showAPIEndpointsModal, setShowAPIEndpointsModal] = useState(false);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [showEditMetaMetadataModal, setShowEditMetaMetadataModal] = useState(false);

  const downloadZip = () => {
    const completeName = `${namespace}-${project}-${tag}`;
    fetch(`/api/v1/projects/${namespace}/${project}/zip?tag=${tag}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        var a = document.createElement('a');
        var file = window.URL.createObjectURL(blob);
        a.href = file;
        a.download = completeName + '.zip';
        a.click();
        window.URL.revokeObjectURL(file);
      });
  };

  return (
    <PageLayout fullWidth footer={false} title={`${namespace}/${project}`}>
      {/* breadcrumbs */}
      <div className="d-flex flex-row align-items-center justify-content-between px-4 mt-2">
        <Breadcrumb className="fw-bold">
          <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
          <Breadcrumb.Item href={`/${namespace}`}>{namespace}</Breadcrumb.Item>
          <Breadcrumb.Item active>
            {project}:{tag}
          </Breadcrumb.Item>
          {projectInfo?.is_private ? (
            <span className="border py-1 ms-2 badge rounded-pill border-danger text-danger">Private</span>
          ) : null}
        </Breadcrumb>
        <div className="d-flex flex-row align-items-center">
          <Dropdown className="me-1">
            <Dropdown.Toggle variant="outline-dark" size="sm">
              <i className="bi bi-three-dots me-1"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow-lg">
              <Dropdown.Item onClick={() => setShowAPIEndpointsModal(true)}>
                <i className="bi bi-hdd-rack me-1"></i>
                API Endpoints
              </Dropdown.Item>
              <Dropdown.Item onClick={() => downloadZip()}>
                <i className="bi bi-file-earmark-zip me-1"></i>
                Download zip
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setShowCompatibilityModal(true)}>
                <i className="me-1 bi bi-intersect"></i>
                Compatibility
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          {user ? (
            <button className="btn btn-sm btn-outline-dark me-1" onClick={() => setShowForkPEPModal(true)}>
              <i className="me-1 bi bi-bezier2"></i>
              Fork
            </button>
          ) : null}
          {
            // if user is logged in and is owner of project
            user && projectInfo && canEdit(user, projectInfo) ? (
              <Dropdown className="me-1">
                <Dropdown.Toggle variant="outline-dark" size="sm">
                  <i className="bi bi-gear"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow-lg">
                  <Dropdown.Item onClick={() => setShowEditMetaMetadataModal(true)}>
                    {/*  pencil write */}
                    <i className="bi bi-pencil-square me-1"></i>
                    Edit
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setShowDeletePEPModal(true)}>
                    <i className="bi bi-trash3 me-1"></i>
                    Delete
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : null
          }
        </div>
      </div>
      <div className="px-4">
        <p>{projectInfo?.description}</p>
      </div>
      <div className="mt-2 px-2 border-bottom border-dark">
        {projectInfoIsLoading || projectInfo === undefined ? (
          <ProjectPageheaderPlaceholder />
        ) : (
          <>
            <div className="flex-row d-flex align-items-end justify-content-between">
              <div className="d-flex flex-row align-items-center">
                <div
                  className={
                    projectView === 'config'
                      ? 'border-primary border-bottom bg-transparent px-2 py-1'
                      : 'border-bottom px-2 py-1'
                  }
                >
                  <button
                    onClick={() => setProjectView('config')}
                    className="border-0 bg-transparent project-button-toggles rounded"
                  >
                    <i className="bi bi-filetype-yml me-1"></i>Config
                  </button>
                </div>
                <div
                  className={
                    projectView === 'samples'
                      ? 'border-primary border-bottom bg-transparent px-2 py-1'
                      : 'border-bottom px-2 py-1'
                  }
                >
                  <button
                    onClick={() => setProjectView('samples')}
                    className="border-0 bg-transparent project-button-toggles rounded"
                  >
                    <i className="bi bi-table me-1"></i>
                    Samples
                  </button>
                </div>
              </div>
              <div>
                <span className="text-muted text-sm">
                  <i className="bi bi-calendar me-1"></i>
                  Created: {dateStringToDate(projectInfo?.submission_date)}
                </span>
                <span className="text-muted text-sm ms-2">
                  <i className="bi bi-clock me-1"></i>
                  Updated: {dateStringToDateTime(projectInfo?.last_update_date)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="row h-100">
        <div className="col-12">
          <div>
            {projectView === 'samples' ? (
              <SampleTable readOnly={!(projectInfo && canEdit(user, projectInfo))} data={projectSamples || ''} />
            ) : (
              <ProjectConfigEditor
                readOnly={!(projectInfo && canEdit(user, projectInfo))}
                value={projectConfigIsLoading ? 'Loading.' : projectConfig ? projectConfig : 'No config file found.'}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditMetaMetadataModal
        show={showEditMetaMetadataModal}
        onHide={() => setShowEditMetaMetadataModal(false)}
        namespace={namespace || ''}
        project={project || ''}
        tag={tag}
      />
      <ProjectAPIEndpointsModal
        show={showAPIEndpointsModal}
        onHide={() => setShowAPIEndpointsModal(false)}
        namespace={namespace || ''}
        project={project || ''}
        tag={tag}
      />
      <DeletePEPModal
        show={showDeletePEPModal}
        onHide={() => setShowDeletePEPModal(false)}
        namespace={namespace || ''}
        project={project || ''}
        tag={tag}
        redirect={`/${user?.login}`}
      />
      <ForkPEPModal
        show={showForkPEPModal}
        onHide={() => setShowForkPEPModal(false)}
        namespace={namespace || ''}
        project={project || ''}
        tag={tag}
      />
      <CompatibilityModal
        namespace={namespace || ''}
        project={project || ''}
        tag={tag}
        show={showCompatibilityModal}
        onHide={() => setShowCompatibilityModal(false)}
      />
    </PageLayout>
  );
};
