import { Fragment, useRef, useState } from 'react';
import YAML from 'yaml';

import { useProjectPage } from '../../contexts/project-page-context';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { useProjectHistory } from '../../hooks/queries/useProjectHistory';
import { useCurrentHistoryId } from '../../hooks/stores/useCurrentHistoryId';
import { Markdown } from '../markdown/render';
import { ProjectDescriptionPlaceholder } from './placeholders/project-description-placeholder';

const MAX_DESC_HEIGHT = 150;

export const ProjectDescription = () => {
  const { namespace, projectName, tag } = useProjectPage();
  const { currentHistoryId } = useCurrentHistoryId();

  const projectDescriptionRef = useRef<HTMLDivElement>(null);

  const showMoreButton = projectDescriptionRef.current?.clientHeight! >= MAX_DESC_HEIGHT;
  const [showMoreDescription, setShowMoreDescription] = useState(false);

  const projectAnnotationQuery = useProjectAnnotation(namespace, projectName, tag);
  const projectHistoryQuery = useProjectHistory(namespace, projectName, tag, currentHistoryId);

  const projectInfo = projectAnnotationQuery.data;

  // if (true) {
  if (projectAnnotationQuery.isLoading) {
    return <ProjectDescriptionPlaceholder />;
  }

  return (
    <Fragment>
      <div className="d-flex align-items-center justify-content-between mx-0 row">
        <div ref={projectDescriptionRef} className="col-md-12" style={{ maxHeight: MAX_DESC_HEIGHT, overflow: 'hidden' }}>
          <Markdown>
            {currentHistoryId !== null
              ? YAML.parse(projectHistoryQuery.data?._config || '')?.description || 'No description'
              : projectInfo?.description || 'No description'}
          </Markdown>
        </div>
      </div>
      {showMoreButton && (
        <div className="d-flex flex-row justify-content-center mb-2 translate-y-1-up">
          {showMoreDescription ? (
            <button
              className="btn btn-sm btn-dark rounded-pill"
              onClick={() => {
                projectDescriptionRef.current?.style.setProperty('max-height', `${MAX_DESC_HEIGHT}px`);
                projectDescriptionRef.current?.style.setProperty('overflow', 'hidden');
                setShowMoreDescription(false);
              }}
            >
              <i className="bi bi-arrow-up" />
              Less
            </button>
          ) : (
            <button
              className="btn btn-sm btn-dark rounded-pill"
              onClick={() => {
                projectDescriptionRef.current?.style.removeProperty('max-height');
                projectDescriptionRef.current?.style.removeProperty('overflow');
                setShowMoreDescription(true);
              }}
            >
              <i className="bi bi-arrow-down" />
              More
            </button>
          )}
        </div>
      )}
    </Fragment>
  );
};
