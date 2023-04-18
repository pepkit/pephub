import { FC, useState, useEffect } from 'react';
import { ProjectPageheaderPlaceholder } from '../components/placeholders/project-page-header';
import { useParams, useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/page-layout';
import { useSession } from '../hooks/useSession';
import { canEdit } from '../utils/permissions';
import { dateStringToDate, dateStringToDateTime } from '../utils/dates';
import { copyToClipboard } from '../utils/etc';
import { DeletePEPModal } from '../components/modals/delete-pep';
import { Dropdown, Tab, Tabs } from 'react-bootstrap';
import { ForkPEPModal } from '../components/modals/fork-pep';
import { useProject } from '../hooks/queries/useProject';
import { SampleTable } from '../components/tables/sample-table';
import { useSampleTable } from '../hooks/queries/useSampleTable';
import { usePapaParse } from 'react-papaparse';
import { ProjectConfigEditor } from '../components/project/project-config';
import { useProjectConfig } from '../hooks/queries/useProjectConfig';
import { ProjectAPIEndpointsModal } from '../components/modals/project-api-endpoints';
import { CompatibilityModal } from '../components/modals/compatibility-modal';

export const ProjectPage: FC = () => {
  const { user, jwt } = useSession();
  const { readString } = usePapaParse();

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
  const [copied, setCopied] = useState(false);
  const [showDeletePEPModal, setShowDeletePEPModal] = useState(false);
  const [showForkPEPModal, setShowForkPEPModal] = useState(false);
  const [showAPIEndpointsModal, setShowAPIEndpointsModal] = useState(false);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);

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
    <PageLayout title={`${namespace}/${project}`}>
      <a className="mb-3" href={`/${namespace}`}>
        <button className="btn btn-sm btn-outline-dark border border-dark">
          <i className="bi bi-arrow-bar-left me-1"></i>
          Back to namespace
        </button>
      </a>
      <div className="border border-dark my-2 p-2 rounded shadow-sm">
        {projectInfoIsLoading || projectInfo === undefined ? (
          <ProjectPageheaderPlaceholder />
        ) : (
          <>
            <div className="flex-row d-flex align-items-start justify-content-between">
              <div className="flex-row d-flex align-items-center">
                <h1 className="fw-bold">
                  {namespace}/{project}:{tag}
                </h1>
                {projectInfo?.is_private ? (
                  <span className="border ms-2 badge rounded-pill border-danger text-danger">Private</span>
                ) : null}
              </div>
              <div>
                <Dropdown>
                  <Dropdown.Toggle
                    className="btn btn-outline-dark border border-dark shadow-sm"
                    id="dropdown-basic"
                    variant="outline-primary"
                  >
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
              </div>
            </div>
            <div>
              {projectInfo?.description ? (
                <p>{projectInfo.description}</p>
              ) : (
                <p className="text-muted text-italic">No description</p>
              )}
            </div>
            <p className="mb-0">
              <span className="fw-bold">PEP Version:</span> {projectInfo.pep_version}
            </p>
            <p className="mb-0">
              <span className="fw-bold">Total Samples:</span> {projectInfo.number_of_samples}
            </p>
            <div className="mt-3 d-flex flex-row align-items-end justify-content-between text-muted">
              <div className="d-flex flex-column">
                <small>
                  <span className="me-3">
                    <i className="bi bi-calendar3"></i>
                    <span className="mx-1">Created:</span>
                    <span> {dateStringToDate(projectInfo.submission_date)}</span>
                  </span>
                </small>
                <small className="mt-1">
                  <span className="me-1">
                    <i className="bi bi-calendar3"></i>
                    <span className="mx-1">Last updated:</span>
                    <span>{dateStringToDateTime(projectInfo.last_update_date)}</span>
                  </span>
                </small>
              </div>
              <div className="d-flex flex-row align-items-end">
                <span className="fw-bold">UID:</span>
                <span className="mx-2" id="project-uid-digest" style={{ fontSize: '0.9rem' }}>
                  {projectInfo?.digest}
                </span>
                <button
                  onClick={() => {
                    copyToClipboard(projectInfo.digest);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1000);
                  }}
                  id="copy-digest-button"
                  className="btn btn-sm btn-outline-dark"
                >
                  {copied ? 'Copied!' : <i className="bi bi-clipboard"></i>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <Tabs transition={false} defaultActiveKey="config">
        <Tab eventKey="config" title="Config">
          <div className="rounded-bottom border border-top-0  p-1 shadow-sm" style={{ minHeight: '50vh' }}>
            <ProjectConfigEditor readOnly={true} value={projectConfig || 'Loading.'} />
          </div>
        </Tab>
        <Tab eventKey="samples" title="Samples">
          <div className="rounded-bottom border border-top-0  p-1 shadow-sm overflow-auto">
            <SampleTable readOnly={true} data={projectSamples || ''} />
          </div>
        </Tab>
      </Tabs>
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
