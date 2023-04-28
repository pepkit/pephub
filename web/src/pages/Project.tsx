import { FC, useState } from 'react';
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
import { usePapaParse } from 'react-papaparse';
import { ProjectConfigEditor } from '../components/project/project-config';
import { useProjectConfig } from '../hooks/queries/useProjectConfig';
import { ProjectAPIEndpointsModal } from '../components/modals/project-api-endpoints';
import { CompatibilityModal } from '../components/modals/compatibility-modal';
import { Badge } from '../components/badges/badge';
import { ProjectAboutPlaceholder } from '../components/placeholders/project-about-placeholder';
import { copyToClipboard } from '../utils/etc';
import { Breadcrumb } from 'react-bootstrap';

type ProjectView = 'samples' | 'config';
type GetProjectView = 'http' | 'phc';

export const ProjectPage: FC = () => {
  const { user, jwt } = useSession();

  const { namespace, project } = useParams();
  let [searchParams] = useSearchParams();

  const tag = searchParams.get('tag') || 'default';

  const { data: projectInfo, isLoading: projectInfoIsLoading } = useProject(namespace, project || '', tag, jwt);
  const { data: projectSamples, isLoading: projectSamplesIsLoading } = useSampleTable(namespace, project, tag, jwt);
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
  const [getProjectView, setGetProjectView] = useState<GetProjectView>('phc');
  const [phcPullCopied, setPhcPullCopied] = useState(false);

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
      <div className="fw-bold px-4 mt-2">
        <Breadcrumb>
          <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
          <Breadcrumb.Item href={`/${namespace}`}>{namespace}</Breadcrumb.Item>
          <Breadcrumb.Item active>{project}</Breadcrumb.Item>
          {projectInfo?.is_private ? (
            <span className="border py-1 ms-2 badge rounded-pill border-danger text-danger">Private</span>
          ) : null}
        </Breadcrumb>
      </div>
      <div className="mt-2 px-2 border-bottom border-dark pb-2">
        {projectInfoIsLoading || projectInfo === undefined ? (
          <ProjectPageheaderPlaceholder />
        ) : (
          <div className="flex-row d-flex align-items-start justify-content-between">
            <div className="d-flex flex-row align-items-center">
              <div className="btn-group me-1" role="group" aria-label="Basic example">
                <button
                  onClick={() => setProjectView('config')}
                  type="button"
                  className={projectView === 'config' ? 'btn btn-outline-dark active' : 'btn btn-outline-dark'}
                >
                  <i className="bi bi-filetype-yml"></i>
                </button>
                <button
                  onClick={() => setProjectView('samples')}
                  type="button"
                  className={projectView === 'samples' ? 'btn btn-outline-dark active' : 'btn btn-outline-dark'}
                >
                  <i className="bi bi-table"></i>
                </button>
              </div>
            </div>
            <div className="d-flex flex-row align-items-center">
              <Dropdown>
                <Dropdown.Toggle className="btn btn-outline-dark border border-dark shadow-sm" variant="outline-dark">
                  Actions
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
                  {user ? (
                    <Dropdown.Item onClick={() => setShowForkPEPModal(true)}>
                      <i className="me-1 bi bi-bezier2"></i>
                      Fork
                    </Dropdown.Item>
                  ) : (
                    <Dropdown.Item disabled onClick={() => setShowForkPEPModal(true)}>
                      <i className="me-1 bi bi-bezier2"></i>
                      Fork
                    </Dropdown.Item>
                  )}
                  {canEdit(user, projectInfo) ? (
                    <>
                      <Dropdown.Divider />
                      <Dropdown.Item href={`/${namespace}/${project}/edit?tag=${tag || 'default'}`}>
                        <i className="bi bi-pencil me-1"></i>
                        Edit
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setShowDeletePEPModal(true)} className="text-danger">
                        <i className="bi bi-trash3 me-1"></i>
                        Delete
                      </Dropdown.Item>
                    </>
                  ) : null}
                </Dropdown.Menu>
              </Dropdown>
              <Dropdown>
                <Dropdown.Toggle className="btn btn-success border border-dark shadow-sm ms-1" variant="success">
                  Get project
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow-lg px-2 py-3" style={{ minWidth: '600px', maxWidth: 'none' }}>
                  <div className="d-flex flex-row mb-2 align-items-center text-sm mt-2">
                    <div
                      onClick={() => setGetProjectView('http')}
                      className={
                        getProjectView === 'http'
                          ? 'cursor-pointer border-2 border-bottom border-primary fw-bold me-2 mb-0'
                          : 'cursor-pointer border-2 border-bottom fw-bold me-2 mb-0'
                      }
                    >
                      HTTPS
                    </div>
                    <div
                      onClick={() => setGetProjectView('phc')}
                      className={
                        getProjectView === 'phc'
                          ? 'cursor-pointer border-2 border-bottom border-primary fw-bold me-2 mb-0'
                          : 'cursor-pointer border-2 border-bottom fw-bold me-2 mb-0'
                      }
                    >
                      PEPhub CLI
                    </div>
                  </div>
                  {getProjectView === 'http' ? (
                    <div className="p-1 text-sm border border-dark rounded bg-secondary bg-opacity-10">
                      <code className="text-dark d-flex flex-row align-items-center justify-content-between">
                        curl {window.location.origin}/api/v1/{namespace}/{project}/download?tag={tag}
                        <button
                          onClick={() => {
                            setPhcPullCopied(true);
                            setTimeout(() => {
                              setPhcPullCopied(false);
                            }, 2000);
                            copyToClipboard(`phc pull ${namespace}/${project}:${tag}`);
                          }}
                          className="ms-2 btn btn-sm btn-dark-outline"
                        >
                          {phcPullCopied ? <i className="bi bi-check-lg"></i> : <i className="bi bi-clipboard"></i>}
                        </button>
                      </code>
                    </div>
                  ) : (
                    <div className="p-1 text-sm border border-dark rounded bg-secondary bg-opacity-10">
                      <code className="text-dark d-flex flex-row align-items-center justify-content-between">
                        phc pull {namespace}/{project}:{tag}
                        <button
                          onClick={() => {
                            setPhcPullCopied(true);
                            setTimeout(() => {
                              setPhcPullCopied(false);
                            }, 2000);
                            copyToClipboard(`phc pull ${namespace}/${project}:${tag}`);
                          }}
                          className="ms-2 btn btn-sm btn-dark-outline"
                        >
                          {phcPullCopied ? <i className="bi bi-check-lg"></i> : <i className="bi bi-clipboard"></i>}
                        </button>
                      </code>
                    </div>
                  )}
                  <div className="my-2 border border-top-0"></div>
                  <div className="mt-2">
                    <span className="p-1">
                      <button className="btn px-0 btn-link" onClick={() => downloadZip()}>
                        <i className="bi bi-file-earmark-zip me-1"></i>
                        Download ZIP
                      </button>
                    </span>
                  </div>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        )}
      </div>
      {/* two columns. one is 3/4 of page then the other is 1/4 of page */}
      <div className="row h-100 gx-2 my-2">
        <div className="col-12">
          <div>
            {projectView === 'samples' ? (
              <SampleTable readOnly={true} data={projectSamples || ''} />
            ) : (
              <div className="p-1 rounded border border-dark shadow-sm">
                <ProjectConfigEditor readOnly={true} value={projectConfig || 'Loading.'} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
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
