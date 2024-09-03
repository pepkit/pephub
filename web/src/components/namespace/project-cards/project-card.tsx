import { FC, Fragment, useState } from 'react';

import { ProjectAnnotation } from '../../../../types';
import { useSession } from '../../../contexts/session-context';
import { useNamespaceStars } from '../../../hooks/queries/useNamespaceStars';
import { dateStringToDateTime } from '../../../utils/dates';
import { MarkdownToText } from '../../markdown/render';
import { DeletePEPModal } from '../../modals/delete-pep';
import { ForkPEPModal } from '../../modals/fork-pep';
import { ProjectCardDropdown } from './project-card-dropdown';

interface Props {
  project: ProjectAnnotation;
}

export const ProjectCard: FC<Props> = ({ project }) => {
  const { user } = useSession();

  const { data: stars } = useNamespaceStars(user?.login || '/', {}, true); // only fetch stars if the namespace is the user's

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
      className="w-100 border rounded shadow-sm ps-3 pe-2 pb-3 pt-2 mt-3 bg-body-tertiary card namespace-card"
    >
      <div className="d-flex flex-row align-items-start justify-content-between">
        <div className="d-flex flex-row align-items-center">
          <a className="fw-semibold fs-4 stretched-link text-decoration-none text-primary-emphasis" href={`${project.namespace}/${project.name}?tag=${project.tag}`}>
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
          starNumber={project.stars_number || 0}
        />
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
      <div className="d-flex flex-row align-items-center mt-3 text-sm">
        <span className="me-3">
          <span className="fw-semibold">Sample Count:</span>
          <span className="mx-1">{project.number_of_samples}</span>
        </span>
        <span>
          <span className="fw-semibold">Schema:</span>
          <span className="mx-1">{project.pep_schema || 'No schema'}</span>
        </span>
      </div>
      <div className="d-flex flex-row align-items-center text-mute text-sm">
        <span className="me-3">
          <span className="fw-semibold">Created:</span>
          <span className="mx-1" id="project-submission-date">{dateStringToDateTime(project.submission_date)}</span>
        </span>
        <span>
          <span className="fw-semibold">Updated:</span>
          <span className="mx-1" id="project-update-date">{dateStringToDateTime(project.last_update_date)}</span>
        </span>
        {project?.forked_from && (
          <span className="p-1 border rounded fw-bold me-1 bg-white ms-auto" style={{zIndex: 2}}>
            <Fragment>
              <i className="bi bi-bezier2"></i>
              <span className="ms-1">Forked from</span>
              <a className="text-decoration-none ms-1" href={`/${project?.forked_from.replace(':', '?tag=')}`}>
                {project?.forked_from}
              </a>
            </Fragment>
          </span>
        )}
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
