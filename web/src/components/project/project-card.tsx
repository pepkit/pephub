import { FC, Fragment, useState } from 'react';

import { ProjectAnnotation } from '../../../types';
import { useNamespaceStars } from '../../hooks/queries/useNamespaceStars';
import { useSession } from '../../hooks/useSession';
import { dateStringToDateTime } from '../../utils/dates';
import { MarkdownToText } from '../markdown/render';
import { DeletePEPModal } from '../modals/delete-pep';
import { ForkPEPModal } from '../modals/fork-pep';
import { ProjectCardDropdown } from './project-card-dropdown';

interface Props {
  project: ProjectAnnotation;
}

export const ProjectCard: FC<Props> = ({ project }) => {
  const { user } = useSession();

  const { starsQuery } = useNamespaceStars(user?.login || '/', {}, true); // only fetch stars if the namespace is the user's
  const stars = starsQuery.data;

  // state
  const [showDeletePEPModal, setShowDeletePEPModal] = useState(false);
  const [showForkPEPModal, setShowForkPEPModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const isStarred = stars?.find(
    (star) => star.namespace === project.namespace && star.name === project.name && star.tag === project.tag,
  );

  return (
    <div
      id={`project-card-${project.namespace}/${project.name}:${project.tag}`}
      className="w-100 border border-dark rounded shadow-sm p-2 mt-3 bg-secondary bg-opacity-10"
      // style={{ backgroundColor: '#f6f8fa' }}
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
        <ProjectCardDropdown
          project={project}
          isStarred={!!isStarred}
          copied={copied}
          setCopied={setCopied}
          setShowDeletePEPModal={setShowDeletePEPModal}
          setShowForkPEPModal={setShowForkPEPModal}
        />
      </div>
      <div>
        <div className="d-flex flex-row align-items-center">
          <div className="me-4">
            <i className="bi bi-star-fill"></i>
            <span className="mx-1">{project.stars_number || 0}</span>
          </div>
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
            <span className="me-3">{project.digest}</span>
            {project?.forked_from && (
              <span className="p-1 border rounded fw-bold">
                <Fragment>
                  <i className="bi bi-bezier2"></i>
                  <span className="ms-1">Forked from</span>
                  <a className="text-decoration-none ms-1" href={`/${project?.forked_from.replace(':', '?tag=')}`}>
                    {project?.forked_from}
                  </a>
                </Fragment>
              </span>
            )}
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
