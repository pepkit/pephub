import { FC, useState } from 'react';

import { ProjectAnnotation } from '../../../types';
import { useSession } from '../../hooks/useSession';
import { dateStringToDateTime } from '../../utils/dates';
import { MarkdownToText } from '../markdown/render';
import { DeletePEPModal } from '../modals/delete-pep';

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
      className="w-100 border border-grey rounded shadow-sm p-3 mt-3"
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
        </div>
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
