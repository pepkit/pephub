import { FC, useState } from 'react';
import { ButtonGroup, Dropdown } from 'react-bootstrap';
import { ProjectAnnotation } from '../../../types';
import { useSession } from '../../hooks/useSession';
import { canEdit } from '../../utils/permissions';
import { DeletePEPModal } from '../modals/delete-pep';
import { dateStringToDateTime } from '../../utils/dates';

interface Props {
  project: ProjectAnnotation;
}

export const ProjectCard: FC<Props> = ({ project }) => {
  const { user } = useSession();

  // state
  const [showDeletePEPModal, setShowDeletePEPModal] = useState(false);

  return (
    <div
      id={`project-card-${project.namespace}/${project.name}:${project.tag}`}
      className="w-100 border border-dark border-2 rounded shadow-sm p-2 mt-2"
    >
      <div className="d-flex flex-row align-items-start justify-content-between">
        <div className="d-flex flex-row align-items-center">
          <a className="fw-bold fs-4" href={`${project.namespace}/${project.name}?tag=${project.tag}`}>
            {project.namespace}/{project.name}:{project.tag}
          </a>
          {project.is_private ? (
            <span className="ms-2 badge rounded-pill border border-danger text-danger">Private</span>
          ) : null}
        </div>
        <div>
          <div className="btn-group dropend">
            <Dropdown as={ButtonGroup}>
              <button disabled type="button" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-star"></i>
                Favorite
              </button>
              <Dropdown.Toggle split size="sm" variant="outline-primary" id="dropdown-split-basic" />
              <Dropdown.Menu>
                <li>
                  <a className="dropdown-item" href={`/${project.namespace}/${project.name}?tag=${project.tag}`}>
                    View
                  </a>
                </li>
                {canEdit(user, project) ? (
                  <>
                    <Dropdown.Item href={`/${project.namespace}/${project.name}/edit?tag=${project.tag}`}>
                      Edit
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => setShowDeletePEPModal(true)} className="text-danger dropdown-item">
                      <i className="bi bi-trash3 me-1"></i>
                      Delete
                    </Dropdown.Item>
                  </>
                ) : null}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </div>
      <div>
        <label className="fw-bold">No. of samples:</label>
        <span className="mb-1">{project.number_of_samples}</span>
        <p className="mb-0">
          {project.description ? (
            project.description
          ) : (
            <em>
              <span className="text-muted text-italic">No description</span>
            </em>
          )}
        </p>
      </div>
      <div className="mt-3">
        <div className="d-flex flex-row align-items-center text-muted">
          <small>
            <span className="me-3">
              <i className="bi bi-calendar3"></i>
              <span className="mx-1">Created:</span>
              <span id="project-submission-date">{dateStringToDateTime(project.submission_date)}</span>
            </span>
            <span className="me-3">{project.digest}</span>
          </small>
        </div>
      </div>
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
