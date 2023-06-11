import { FC, useState } from 'react';
import { ButtonGroup, Dropdown } from 'react-bootstrap';
import { ProjectAnnotation } from '../../../types';
import { useSession } from '../../hooks/useSession';
import { canEdit } from '../../utils/permissions';
import { DeletePEPModal } from '../modals/delete-pep';
import { dateStringToDateTime } from '../../utils/dates';
import { Badge } from '../badges/badge';

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
      className="w-100 border border-dark rounded shadow-sm p-2 mt-2"
    >
      <div className="d-flex flex-row align-items-start justify-content-between">
        <div className="d-flex flex-row align-items-center">
          <a className="fw-bold fs-4" href={`${project.namespace}/${project.name}?tag=${project.tag}`}>
            {project.namespace}/{project.name}:{project.tag}
          </a>
          {project.is_private ? (
            <span className="ms-2 badge rounded-pill border border-danger text-danger">Private</span>
          ) : null}
          {project.pep_schema ? (
            <Badge className="ms-2" size="small" variant="primary">
              {project.pep_schema}
            </Badge>
          ) : null}
        </div>
        <div>
          <div className="btn-group dropend">
            <Dropdown as={ButtonGroup}>
              <button disabled type="button" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-star me-1"></i>
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
        <span className="mx-1">{project.number_of_samples}</span>

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
              <i className="ms-4 bi bi-calendar3"></i>
              <span className="mx-1">Updated:</span>
              <span id="project-update-date">{dateStringToDateTime(project.last_update_date)}</span>
            </span>
            <span className="me-5">{project.digest}</span>
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
