import { Fragment } from 'react';

import { useProjectPage } from '../../contexts/project-page-context';
import { useProjectAllHistory } from '../../hooks/queries/useProjectAllHistory';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { useProjectHistory } from '../../hooks/queries/useProjectHistory';
import { useCurrentHistoryId } from '../../hooks/stores/useCurrentHistoryId';
import { dateStringToDateTime } from '../../utils/dates';
import { ProjectInfoFooterPlaceholder } from './placeholders/project-info-footer-placeholder';

export const ProjectInfoFooter = () => {
  const { namespace, projectName, tag } = useProjectPage();
  const { currentHistoryId } = useCurrentHistoryId();

  const projectAnnotationQuery = useProjectAnnotation(namespace, projectName, tag);
  const projectAllHistoryQuery = useProjectAllHistory(namespace, projectName, tag);
  const projectHistoryQuery = useProjectHistory(namespace, projectName, tag, currentHistoryId);

  const projectInfo = projectAnnotationQuery.data;

  // if (true) {
  if (projectAnnotationQuery.isLoading) {
    return <ProjectInfoFooterPlaceholder />;
  }

  return (
    <div className="px-4 pb-3 border-bottom">
      <div className="d-flex flex-row align-items-center text-muted mt-1">
        <small className="d-flex flex-row align-items-center justify-content-between w-100">
          <span className="me-3">
            <i className="bi bi-calendar3"></i>
            <span className="mx-1">Created:</span>
            <span id="project-submission-date">{dateStringToDateTime(projectInfo?.submission_date || '')}</span>
            <i className="ms-4 bi bi-calendar3"></i>
            <span className="mx-1">Updated:</span>
            <span id="project-update-date">
              {currentHistoryId !== null
                ? dateStringToDateTime(
                    projectAllHistoryQuery.data?.history.find((h) => h.change_id === currentHistoryId)?.change_date ||
                      '',
                  )
                : dateStringToDateTime(projectInfo?.last_update_date || '')}
            </span>
            <i className="ms-4 bi bi-arrows-expand"></i>
            <span className="mx-1">Sample Count:</span>
            <span id="project-update-date">
              {currentHistoryId !== null
                ? projectHistoryQuery.data?._sample_dict.length
                : projectInfo?.number_of_samples}
            </span>
          </span>
          <span className="">
            {projectInfo?.forked_from && (
              <span className="p-1 border rounded fw-bold">
                <Fragment>
                  <i className="bi bi-bezier2"></i>
                  <span className="ms-1">Forked from</span>
                  <a className="text-decoration-none ms-1" href={`/${projectInfo?.forked_from.replace(':', '?tag=')}`}>
                    {projectInfo?.forked_from}
                  </a>
                </Fragment>
              </span>
            )}
            {/*{projectInfo?.digest}*/}
          </span>
        </small>
      </div>
    </div>
  );
};
