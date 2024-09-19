import { FC, useState, useMemo } from 'react';

import { ProjectAnnotation, Sample } from '../../../types';
import { useSession } from '../../contexts/session-context';
import { useNamespaceStars } from '../../hooks/queries/useNamespaceStars';
import { dateStringToDateTime } from '../../utils/dates';
import { MarkdownToText } from '../markdown/render';
import { ForkPEPModal } from '../modals/fork-pep';
import { RemovePEPFromPOPModal } from '../modals/remove-pep-from-pop';
import { PopCardDropdown } from './pop-card-dropdown';

interface Props {
  parentNamespace: string;
  parentName: string;
  parentTag: string;
  project: ProjectAnnotation;
  currentPeps: Sample[];
}

export const PopCard: FC<Props> = ({ project, currentPeps, parentName, parentNamespace, parentTag }) => {
  const { user } = useSession();
  const { data: stars } = useNamespaceStars(user?.login || '/', {}, true); // only fetch stars if the namespace is the user's

  const [showForkPEPModal, setShowForkPEPModal] = useState(false);
  const [showRemovePEPModal, setShowRemovePEPModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const isStarred = useMemo(() => 
    !!stars?.find(
      (star) => star.namespace === project.namespace && star.name === project.name && star.tag === project.tag
    ),
    [stars, project.namespace, project.name, project.tag]
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
        <PopCardDropdown
          project={project}
          isStarred={isStarred}
          copied={copied}
          setCopied={setCopied}
          setShowForkPEPModal={setShowForkPEPModal}
          setShowRemovePEPModal={setShowRemovePEPModal}
          starNumber={project?.stars_number}
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
          <div className="p-1 border rounded fw-bold me-1 bg-white ms-auto position-relative forked-link" style={{zIndex: 2, margin: '-1.25em 0 -1em'}}>
            <i className="bi bi-bezier2"></i>
            <span className="ms-1">Forked from</span>
            <a className="text-decoration-none ms-1 stretched-link" href={`/${project?.forked_from.replace(':', '?tag=')}`}>
              {project?.forked_from}
            </a>
          </div>
        )}
      </div>
      <ForkPEPModal
        show={showForkPEPModal}
        onHide={() => setShowForkPEPModal(false)}
        project={project.name}
        namespace={project.namespace}
        tag={project.tag}
      />
      <RemovePEPFromPOPModal
        show={showRemovePEPModal}
        onHide={() => setShowRemovePEPModal(false)}
        currentPeps={currentPeps}
        projectToRemove={project.name}
        namespaceToRemove={project.namespace}
        tagToRemove={project.tag}
        namespaceToRemoveFrom={parentNamespace}
        projectToRemoveFrom={parentName}
        tagToRemoveFrom={parentTag}
      />
    </div>
  );
};
