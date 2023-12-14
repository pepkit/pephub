import { FC, Fragment, useState } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import toast from 'react-hot-toast';

import { ProjectAnnotation } from '../../../types';
import { useAddStar } from '../../hooks/mutations/useAddStar';
import { useRemoveStar } from '../../hooks/mutations/useRemoveStar';
import { useNamespaceStars } from '../../hooks/queries/useNamespaceStars';
import { useSession } from '../../hooks/useSession';
import { dateStringToDateTime } from '../../utils/dates';
import { MarkdownToText } from '../markdown/render';
import { DeletePEPModal } from '../modals/delete-pep';
import { ForkPEPModal } from '../modals/fork-pep';
import { LoadingSpinner } from '../spinners/loading-spinner';

interface Props {
  project: ProjectAnnotation;
}

export const ProjectCard: FC<Props> = ({ project }) => {
  const { user } = useSession();
  const { data: stars } = useNamespaceStars(user?.login, {}, true); // only fetch stars if the namespace is the user's

  // state
  const [showDeletePEPModal, setShowDeletePEPModal] = useState(false);
  const [showForkPEPModal, setShowForkPEPModal] = useState(false);

  const starAddMutation = useAddStar(user?.login || '', project.namespace, project.name, project.tag);
  const starRemoveMutation = useRemoveStar(user?.login || '', project.namespace, project.name, project.tag);

  const isStarred = stars?.results.find(
    (star) => star.namespace === project.namespace && star.name === project.name && star.tag === project.tag,
  );

  return (
    <div
      id={`project-card-${project.namespace}/${project.name}:${project.tag}`}
      className="w-100 border border-dark rounded shadow-sm p-2 mt-3"
      style={{ backgroundColor: '#f6f8fa' }}
    >
      <div className="d-flex flex-row align-items-start justify-content-between">
        <div className="d-flex flex-row align-items-center">
          <a className="fw-bold fs-4" href={`${project.namespace}/${project.name}?tag=${project.tag}`}>
            {project.namespace}/{project.name}:{project.tag}
          </a>
          {project.is_private ? (
            <span className="ms-2 badge text-dark rounded-pill border border-dark">Private</span>
          ) : (
            <span className="ms-2 badge text-dark rounded-pill border border-dark">Public</span>
          )}
          {project.pop ? (
            <span className="ms-2 badge bg-primary text-white rounded-pill border border-primary flex align-items-center bg-opacity-75">
              <img
                src="/popcorn-white.svg"
                height="10px"
                width="10px"
                alt="Popcorn icon"
                className="me-1 text-primary"
              />
              POP
            </span>
          ) : null}
        </div>
        <Dropdown as={ButtonGroup}>
          <Button
            disabled={starAddMutation.isPending || starRemoveMutation.isPending}
            variant="outline-dark"
            size="sm"
            onClick={() => {
              if (!user) {
                toast.error('You must be logged in to star a project!');
              } else if (isStarred) {
                starRemoveMutation.mutate();
              } else {
                starAddMutation.mutate();
              }
            }}
          >
            {isStarred ? (
              <Fragment>
                <div className="d-flex align-items-center">
                  <i className="text-primary bi bi-star-fill me-1"></i>
                  <span className="text-primary">
                    {starRemoveMutation.isPending ? (
                      <Fragment>
                        Star
                        <LoadingSpinner className="w-4 h-4 spin ms-1 mb-tiny fill-secondary" />
                      </Fragment>
                    ) : (
                      'Star'
                    )}
                  </span>
                </div>
              </Fragment>
            ) : (
              <Fragment>
                <div className="d-flex align-items-center">
                  <i className="bi bi-star me-1"></i>
                  <span>
                    {starAddMutation.isPending ? (
                      <Fragment>
                        Star
                        <LoadingSpinner className="w-4 h-4 spin ms-1 mb-tiny fill-secondary" />
                      </Fragment>
                    ) : (
                      'Star'
                    )}
                  </span>
                </div>
              </Fragment>
            )}
          </Button>
          <Dropdown.Toggle split variant="outline-dark" id="dropdown-split-basic" />
          <Dropdown.Menu>
            <Dropdown.Item href={`/${project.namespace}/${project.name}`}>View</Dropdown.Item>
            {user ? (
              <Dropdown.Item
                onClick={() => {
                  setShowForkPEPModal(true);
                }}
              >
                Fork
              </Dropdown.Item>
            ) : (
              <Dropdown.Item disabled>Fork (log in to fork)</Dropdown.Item>
            )}
            {user && user.login === project.namespace && (
              <Fragment>
                <Dropdown.Divider />
                <Dropdown.Item
                  onClick={() => {
                    setShowDeletePEPModal(true);
                  }}
                  className="text-danger"
                >
                  Delete
                </Dropdown.Item>
              </Fragment>
            )}
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <div>
        <div className="d-flex flex-row align-items-center">
          <div className="me-4">
            <label className="fw-bold">No. of samples:</label>
            <span className="mx-1">{project.number_of_samples}</span>
          </div>
          <div>
            <label className="fw-bold">Schema:</label>
            <span className="mx-1">{project.pep_schema || 'No schema'}</span>
          </div>
        </div>
        <div className="mb-0">
          {project.description ? (
            <MarkdownToText>{project.description}</MarkdownToText>
          ) : (
            <em>
              <span className="text-muted text-italic">No description</span>
            </em>
          )}
        </div>
      </div>
      <div className="mt-3">
        <div className="d-flex flex-row align-items-center text-muted">
          <small>
            <span className="me-3">
              <i className="bi bi-calendar3"></i>
              <span className="mx-1">Created:</span>
              <span id="project-submission-date">{dateStringToDateTime(project.submission_date)}</span>
              <i className="ms-4 bi bi-calendar3"></i>
              <span className="mx-1">Updated:</span>
              <span id="project-update-date">{dateStringToDateTime(project.last_update_date)}</span>
            </span>
            <span className="me-5">{project.digest}</span>
          </small>
        </div>
      </div>
      <ForkPEPModal
        show={showForkPEPModal}
        onHide={() => setShowForkPEPModal(false)}
        project={project.name}
        namespace={project.namespace}
        tag={project.tag}
      />
      <DeletePEPModal
        show={showDeletePEPModal}
        onHide={() => setShowDeletePEPModal(false)}
        project={project.name}
        namespace={project.namespace}
        tag={project.tag}
      />
    </div>
  );
};
