import { Fragment } from 'react';

import { useProjectPage } from '../../contexts/project-page-context';
import { dateStringToDateTime } from '../../utils/dates';

export const ProjectInfoFooter = () => {
  const { projectAnnotationQuery } = useProjectPage();

  const projectInfo = projectAnnotationQuery.data;

  return (
    <div className="px-4">
      <div className="d-flex flex-row align-items-center text-muted mt-1">
        <small className="d-flex flex-row align-items-center justify-content-between w-100">
          <span className="me-3">
            <i className="bi bi-calendar3"></i>
            <span className="mx-1">Created:</span>
            <span id="project-submission-date">{dateStringToDateTime(projectInfo?.submission_date || '')}</span>
            <i className="ms-4 bi bi-calendar3"></i>
            <span className="mx-1">Updated:</span>
            <span id="project-update-date">{dateStringToDateTime(projectInfo?.last_update_date || '')}</span>
          </span>
          <span className="">
            {projectInfo?.forked_from && (
              <span className="me-2 p-1 border rounded fw-bold">
                <Fragment>
                  <i className="bi bi-bezier2"></i>
                  <span className="ms-1">Forked from</span>
                  <a className="text-decoration-none ms-1" href={`/${projectInfo?.forked_from.replace(':', '?tag=')}`}>
                    {projectInfo?.forked_from}
                  </a>
                </Fragment>
              </span>
            )}
            {projectInfo?.digest}
          </span>
        </small>
      </div>
    </div>
  );
};
