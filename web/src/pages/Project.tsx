import { FC, useState } from 'react';
import useSWR from 'swr';
import { ProjectPageheaderPlaceholder } from '../components/placeholders/project-page-header';
import { useParams, useSearchParams } from 'react-router-dom';
import { getProject } from '../api/project';
import { PageLayout } from '../components/layout/page-layout';
import { useSession } from '../hooks/useSession';
import { canEdit } from '../utils/permissions';
import { dateStringToDate, dateStringToDateTime } from '../utils/dates';
import { copyToClipboard } from '../utils/etc';
import { DeletePEPModal } from '../components/modals/delete-pep';
import { Dropdown } from 'react-bootstrap';
import { ForkPEPModal } from '../components/modals/fork-pep';

// data fetcher
const projectFetcher = (namespace: string, project: string, tag: string, jwt: string | null) =>
  getProject(namespace, project, tag, jwt);

export const ProjectPage: FC = () => {
  const { user, jwt } = useSession();

  const { namespace, project } = useParams();
  let [searchParams] = useSearchParams();

  const tag = searchParams.get('tag') || 'default';

  const { data: projectInfo, isLoading: projectInfoIsLoading } = useSWR(
    [namespace, project, tag || 'default', jwt],
    ([namespace, project, tag]) => projectFetcher(namespace || '', project || '', tag || '', jwt),
  );

  // state
  const [copied, setCopied] = useState(false);
  const [showDeletePEPModal, setShowDeletePEPModal] = useState(false);
  const [showForkPEPModal, setShowForkPEPModal] = useState(false);

  return (
    <PageLayout title={`${namespace}/${project}`}>
      {projectInfoIsLoading || projectInfo === undefined ? (
        <ProjectPageheaderPlaceholder />
      ) : (
        <>
          <a className="mb-3" href={`/${namespace}`}>
            <button className="btn btn-sm btn-outline-dark">
              <i className="bi bi-arrow-bar-left me-1"></i>
              Back to namespace
            </button>
          </a>
          <div className="flex-row d-flex align-items-start justify-content-between">
            <div className="flex-row d-flex align-items-center">
              <h1>
                {namespace}/{project}:{tag}
              </h1>
              {projectInfo?.is_private ? (
                <span className="border ms-2 badge rounded-pill border-danger text-danger">Private</span>
              ) : null}
            </div>
            <div>
              <Dropdown>
                <Dropdown.Toggle className="btn btn-outline-dark" id="dropdown-basic" variant="outline-primary">
                  Actions
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item href={`/${namespace}/${project}/export?tag=${tag}`}>
                    <i className="bi bi-hdd-rack me-1"></i>
                    API Endpoints
                  </Dropdown.Item>
                  <Dropdown.Item>
                    <i className="bi bi-file-earmark-zip me-1"></i>
                    Download zip
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setShowForkPEPModal(true)}>
                    <img src="/github-branch.svg" height="20" alt="Fork an endpoint" />
                    Fork
                  </Dropdown.Item>
                  {canEdit(user, projectInfo) ? (
                    <>
                      <Dropdown.Divider />
                      <Dropdown.Item>
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
          <div className="text-secondary mb-3 d-flex flex-row align-items-center">
            <span className="fw-bold">UID:</span>
            <span className="mx-2" id="project-uid-digest">
              {projectInfo?.digest}
            </span>
            <button
              onClick={() => {
                copyToClipboard(projectInfo.digest);
                setCopied(true);
                setTimeout(() => setCopied(false), 1000);
              }}
              id="copy-digest-button"
              className="btn btn-sm btn-outline-secondary"
            >
              {copied ? 'Copied!' : <i className="bi bi-clipboard"></i>}
            </button>
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
          </div>
        </>
      )}
      <div className="my-2 border-bottom border-secondary"></div>
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
    </PageLayout>
  );
};
