import { Fragment, useRef, useState } from 'react';

import { useProjectPage } from '../../contexts/project-page-context';
import { Markdown } from '../markdown/render';

const MAX_DESC_HEIGHT = 200;

export const ProjectDescription = () => {
  const { projectAnnotationQuery } = useProjectPage();

  const projectDescriptionRef = useRef<HTMLDivElement>(null);
  const showMoreButton = projectDescriptionRef.current?.clientHeight! >= MAX_DESC_HEIGHT;
  const [showMoreDescription, setShowMoreDescription] = useState(false);

  const projectInfo = projectAnnotationQuery.data;

  return (
    <Fragment>
      <div className="d-flex flex-row align-items-center justify-content-between px-4 w-100 border-bottom">
        <div ref={projectDescriptionRef} className="w-100" style={{ maxHeight: MAX_DESC_HEIGHT, overflow: 'hidden' }}>
          <Markdown>{projectInfo?.description || 'No description'}</Markdown>
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