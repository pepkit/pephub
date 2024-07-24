import { Fragment, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { HistoryBorderBox } from '../components/history/history-border-box';
import { HistoryInfoBox } from '../components/history/history-info-box';
import { HistoryToolbar } from '../components/history/history-toolbar';
import { PageLayout } from '../components/layout/page-layout';
import { LargeSampleTableModal } from '../components/modals/sample-table-too-large';
import { PopInterface } from '../components/pop/pop-interface';
import { ProjectHeader } from '../components/project/project-header';
import { ProjectInterface } from '../components/project/project-interface';
import { useProjectPage } from '../contexts/project-page-context';
import { useProjectAnnotation } from '../hooks/queries/useProjectAnnotation';
import { useProjectConfig } from '../hooks/queries/useProjectConfig';
import { useSampleTable } from '../hooks/queries/useSampleTable';
import { useSubsampleTable } from '../hooks/queries/useSubsampleTable';
import { useCurrentHistoryId } from '../hooks/stores/useCurrentHistoryId';

function extractSampleTableIndex(text: string) {
  const match = text.match(/^sample_table_index:\s*(.+)$/m);
  return match ? match[1] : null;
}

export const ProjectPage = () => {
  // auto-dismiss popup for large sample tables
  const [hideLargeSampleTableModal] = useLocalStorage('hideLargeSampleTableModal', 'false');

  // project page context state
  const { namespace, projectName, tag, shouldFetchSampleTable, forceTraditionalInterface } = useProjectPage();

  // get the value of which history id is being viewed
  const { currentHistoryId, setCurrentHistoryId } = useCurrentHistoryId();

  const projectConfigQuery = useProjectConfig(namespace, projectName, tag);
  const projectAnnotationQuery = useProjectAnnotation(namespace, projectName, tag);
  const sampleTableQuery = useSampleTable({
    namespace,
    project: projectName,
    tag,
    enabled: shouldFetchSampleTable,
  });
  const subSampleTableQuery = useSubsampleTable(namespace, projectName, tag);

  // pull out data for easier access
  const projectInfo = projectAnnotationQuery.data;

  // local state
  const [showLargeSampleTableModal, setShowLargeSampleTableModal] = useState(false);

  const sampleTableIndex = projectConfigQuery.data ? extractSampleTableIndex(projectConfigQuery.data?.config) : null;

  useEffect(() => {
    if (projectInfo !== undefined && hideLargeSampleTableModal === 'false') {
      setShowLargeSampleTableModal(!shouldFetchSampleTable);
    }
  }, [shouldFetchSampleTable, projectInfo]);

  // add class to body for a border
  // useEffect(() => {
  //   if (currentHistoryId !== null) {
  //     document.body.classList.add('viewing-history-border');
  //     document.body.classList.add('border-warning');
  //   } else {
  //     document.body.classList.remove('viewing-history-border');
  //     document.body.classList.remove('border-warning');
  //   }
  //   return () => {
  //     document.body.classList.remove('viewing-history-border');
  //     document.body.classList.remove('border-warning');
  //   };
  // }, [currentHistoryId]);

  // key binding for escaping history view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentHistoryId !== null) {
        // clear the history id
        e.preventDefault();
        setCurrentHistoryId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (projectAnnotationQuery.error) {
    return (
      <PageLayout fullWidth footer={false} title={`${namespace}/${projectName}`}>
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
          <h1 className="fw-bold">Error 😫</h1>
          <p className="text-muted fst-italic">An error occured fetching the project... Are you sure it exists?</p>
          <div>
            <a href={`/${namespace}`}>
              <button className="btn btn-dark">Take me back</button>
            </a>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <div className="position-relative">
      {currentHistoryId !== null && (
        <Fragment>
          <HistoryInfoBox />
          <div className="position-absolute top-0 start-0 w-100">
            <HistoryToolbar />
          </div>
          <HistoryBorderBox />
        </Fragment>
      )}
      <PageLayout fullWidth footer={false} title={`${namespace}/${projectName}`}>
        <ProjectHeader />
        {projectInfo?.pop && !forceTraditionalInterface ? (
          <PopInterface projectInfo={projectInfo} sampleTable={sampleTableQuery.data} />
        ) : (
          <ProjectInterface
            key={`${projectAnnotationQuery.dataUpdatedAt}-${projectConfigQuery.dataUpdatedAt}-${sampleTableQuery.dataUpdatedAt}-${subSampleTableQuery.dataUpdatedAt}`}
            projectInfo={projectAnnotationQuery.data}
            projectConfig={projectConfigQuery.data}
            sampleTable={sampleTableQuery.data}
            subSampleTable={subSampleTableQuery.data}
            sampleTableIndex={sampleTableIndex}
          />
        )}
        <LargeSampleTableModal
          namespace={namespace}
          show={showLargeSampleTableModal}
          onHide={() => setShowLargeSampleTableModal(false)}
        />
      </PageLayout>
    </div>
  );
};
