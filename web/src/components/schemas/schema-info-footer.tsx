import { Fragment } from 'react';

import { useProjectPage } from '../../contexts/project-page-context';
import { useProjectAllHistory } from '../../hooks/queries/useProjectAllHistory';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { useProjectHistory } from '../../hooks/queries/useProjectHistory';
import { useCurrentHistoryId } from '../../hooks/stores/useCurrentHistoryId';
import { dateStringToDateTime } from '../../utils/dates';
// import { ProjectInfoFooterPlaceholder } from './placeholders/project-info-footer-placeholder';

export const SchemaInfoFooter = () => {
  const { namespace, projectName, tag } = useProjectPage();
  const { currentHistoryId } = useCurrentHistoryId();

  const projectAnnotationQuery = useProjectAnnotation(namespace, projectName, tag);
  const projectAllHistoryQuery = useProjectAllHistory(namespace, projectName, tag);
  const projectHistoryQuery = useProjectHistory(namespace, projectName, tag, currentHistoryId);

  const projectInfo = projectAnnotationQuery.data;

  // if (true) {
  if (projectAnnotationQuery.isLoading) {
    // return <ProjectInfoFooterPlaceholder />;
  }

  return (
    <div className="d-flex align-items-center text-muted mt-1 mx-0 pb-3 row">
      <small className="d-flex flex-row align-items-center justify-content-between col-md-12">
        <div className="me-3 row">
          <div className="col-sm-auto me-1">
            <i className="bi bi-calendar3"></i>
            <span className="mx-1">Created:</span>
            <span id="project-submission-date">{dateStringToDateTime(projectInfo?.submission_date || '')}</span>
          </div>
          <div className="col-sm-auto me-1">
            <i className="bi bi-calendar3"></i>
            <span className="mx-1">Updated:</span>
            <span id="project-update-date">
              {currentHistoryId !== null
                ? dateStringToDateTime(
                    projectAllHistoryQuery.data?.history.find((h) => h.change_id === currentHistoryId)?.change_date ||
                      '',
                  )
                : dateStringToDateTime(projectInfo?.last_update_date || '')}
            </span>
          </div>
          <div className="col-sm-auto">
            <i className="bi bi-arrows-expand"></i>
            <span className="mx-1">{projectInfo?.pop ? 'Project' : 'Sample'} Count:</span>
            <span id="project-update-date">
              {currentHistoryId !== null
                ? projectHistoryQuery.data?._sample_dict.length
                : projectInfo?.number_of_samples}
            </span>
          </div>
        </div>
        <span className="">
          {projectInfo?.forked_from && (
            <span className="p-1 border rounded fw-bold me-1 bg-white ms-auto position-relative forked-link" style={{zIndex: 2, margin: '-1.25em 0 -1em'}}>
              <i className="bi bi-bezier2"></i>
              <span className="ms-1">Forked from</span>
              <a className="text-decoration-none ms-1 stretched-link" href={`/${projectInfo?.forked_from.replace(':', '?tag=')}`}>
                {projectInfo?.forked_from}
              </a>
            </span>
          )}
          {/*{projectInfo?.digest}*/}
        </span>
      </small>
    </div>
  );
};
