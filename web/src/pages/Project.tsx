import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocalStorage } from 'usehooks-ts';

import { Sample } from '../../types';
import { HistoryInfoBox } from '../components/history/history-info-box';
import { HistoryToolbar } from '../components/history/history-toolbar';
import { PageLayout } from '../components/layout/page-layout';
import { LargeSampleTableModal } from '../components/modals/sample-table-too-large';
import { ProjectPageheaderPlaceholder } from '../components/placeholders/project-page-header';
import { PopInterface } from '../components/pop/pop-interface';
import { ProjectConfigEditor } from '../components/project/project-config';
import { ProjectInfoFooter } from '../components/project/project-info-footer';
import { ProjectDescription } from '../components/project/project-page-description';
import { ProjectHeaderBar } from '../components/project/project-page-header-bar';
import { ProjectValidationAndEditButtons } from '../components/project/project-validation-and-edit-buttons';
import { SampleTable } from '../components/tables/sample-table';
import { useProjectPage } from '../contexts/project-page-context';
import { useSession } from '../contexts/session-context';
import { useTotalProjectChangeMutation } from '../hooks/mutations/useTotalProjectChangeMutation';
import { useNamespaceStars } from '../hooks/queries/useNamespaceStars';
import { useProjectAnnotation } from '../hooks/queries/useProjectAnnotation';
import { useProjectConfig } from '../hooks/queries/useProjectConfig';
import { useProjectHistory } from '../hooks/queries/useProjectHistory';
import { useSampleTable } from '../hooks/queries/useSampleTable';
import { useSubsampleTable } from '../hooks/queries/useSubsampleTable';
import { useView } from '../hooks/queries/useView';
import { useCurrentHistoryId } from '../hooks/stores/useCurrentHistoryId';
import { useProjectPageView } from '../hooks/stores/useProjectPageView';
import { getOS } from '../utils/etc';
import { canEdit } from '../utils/permissions';

export const ProjectPage = () => {
  // user info
  const { user } = useSession();

  const [searchParams] = useSearchParams();

  // auto-dismiss popup for large sample tables
  const [hideLargeSampleTableModal] = useLocalStorage('hideLargeSampleTableModal', 'false');

  // os info
  const os = getOS();

  // project page context state
  const { namespace, projectName, tag, shouldFetchSampleTable, forceTraditionalInterface } = useProjectPage();

  // get the value of which history id is being viewed
  const { currentHistoryId } = useCurrentHistoryId();

  // get the page view from stores
  const { pageView } = useProjectPageView();

  const { data: projectHistoryView } = useProjectHistory(namespace, projectName, tag, currentHistoryId);
  const { data: stars } = useNamespaceStars(user?.login || '/', {}, true);

  const projectAnnotationQuery = useProjectAnnotation(namespace, projectName, tag);
  const projectConfigQuery = useProjectConfig(namespace, projectName, tag);
  const sampleTableQuery = useSampleTable({
    namespace,
    project: projectName,
    tag,
    enabled: shouldFetchSampleTable,
  });
  const subSampleTableQuery = useSubsampleTable(namespace, projectName, tag);

  // pull out data for easier access
  const projectInfo = projectAnnotationQuery.data;
  const projectConfig = projectConfigQuery.data;
  const samples = sampleTableQuery?.data?.items || [];
  const subsamples = subSampleTableQuery.data?.items || [];

  // determine if the project is starred by the user
  const isStarred =
    stars?.find((star) => star.namespace === projectInfo?.namespace && star.name === projectInfo?.name) !== undefined;

  // view selection
  const [view, setView] = useState(searchParams.get('view') || undefined);

  const { data: viewData } = useView({
    namespace,
    project: projectName,
    tag,
    view,
    enabled: view !== undefined,
  });

  // local state
  const [showLargeSampleTableModal, setShowLargeSampleTableModal] = useState(false);

  // state for editing config, samples, and subsamples
  const [newProjectConfig, setNewProjectConfig] = useState('');
  const [newProjectSamples, setNewProjectSamples] = useState<Sample[]>([]);
  const [newProjectSubsamples, setNewProjectSubsamples] = useState<Sample[]>([]);

  // check if config or samples are dirty
  const configIsDirty = newProjectConfig !== projectConfig?.config;

  // use JSON stringify to compare arrays
  const samplesIsDirty = JSON.stringify(newProjectSamples) !== JSON.stringify(samples);
  const subsamplesIsDirty = JSON.stringify(newProjectSubsamples) !== JSON.stringify(subsamples);

  const { submit: submitNewProject } = useTotalProjectChangeMutation(namespace, projectName, tag);

  const projectDataRef = useRef<HTMLDivElement>(null);

  const onTableChange = useCallback(
    (value: Sample[]) => {
      if (pageView === 'samples') {
        setNewProjectSamples(value);
      } else {
        setNewProjectSubsamples(value);
      }
    },
    [pageView],
  );

  useEffect(() => {
    if (projectInfo !== undefined && hideLargeSampleTableModal === 'false') {
      setShowLargeSampleTableModal(!shouldFetchSampleTable);
    }
  }, [shouldFetchSampleTable, projectInfo]);

  // on save handler
  useEffect(() => {
    window.addEventListener('keydown', (e) => {
      let ctrlKey = false;
      switch (os) {
        case 'Mac OS':
          ctrlKey = e.metaKey;
          break;
        default:
          ctrlKey = e.ctrlKey;
          break;
      }
      // check for ctrl+s, ignore if fetchsampletable is false
      if (ctrlKey && e.key === 's' && shouldFetchSampleTable && !view) {
        e.preventDefault();
        if (configIsDirty || samplesIsDirty || subsamplesIsDirty) {
          submitNewProject({
            config: newProjectConfig,
            samples: newProjectSamples,
            subsamples: newProjectSubsamples,
          });
        }
      }
    });
  }, []);

  // add class to body for a border
  useEffect(() => {
    if (currentHistoryId !== null) {
      document.body.classList.add('viewing-history-border');
      document.body.classList.add('border-warning');
    } else {
      document.body.classList.remove('viewing-history-border');
      document.body.classList.remove('border-warning');
    }
    return () => {
      document.body.classList.remove('viewing-history-border');
      document.body.classList.remove('border-warning');
    };
  }, [currentHistoryId]);

  // TODO: These are technically an anti-pattern, but I'm not sure how to fix it...
  // set new project config and samples on load -- when the data is fetched and defined
  useEffect(() => {
    setNewProjectConfig(projectConfig?.config || '');
  }, [projectConfigQuery.data]);

  // set new project samples and subsamples on load -- when the data is fetched and defined
  useEffect(() => {
    setNewProjectSamples(samples);
  }, [sampleTableQuery.data]);

  // set new project samples and subsamples on load -- when the data is fetched and defined
  useEffect(() => {
    setNewProjectSubsamples(subsamples);
  }, [subSampleTableQuery.data]);

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
        </Fragment>
      )}
      <PageLayout fullWidth footer={false} title={`${namespace}/${projectName}`}>
        <div className="shadow-sm pt-2">
          <ProjectHeaderBar isStarred={isStarred} />
          <ProjectDescription />
          <ProjectInfoFooter />
        </div>
        {projectInfo?.pop && !forceTraditionalInterface ? (
          <PopInterface project={projectInfo} />
        ) : (
          <Fragment>
            <div className="pt-0 px-2" style={{ backgroundColor: '#EFF3F640', height: '3.5em' }}>
              {projectAnnotationQuery.isFetching || projectInfo === undefined ? (
                <ProjectPageheaderPlaceholder />
              ) : (
                <ProjectValidationAndEditButtons
                  projectAnnotationQuery={projectAnnotationQuery}
                  newProjectSamples={newProjectSamples}
                  newProjectSubsamples={newProjectSubsamples}
                  newProjectConfig={newProjectConfig}
                  view={view}
                  setView={setView}
                  setNewProjectConfig={setNewProjectConfig}
                  setNewProjectSamples={setNewProjectSamples}
                  setNewProjectSubsamples={setNewProjectSubsamples}
                  configIsDirty={configIsDirty}
                  samplesIsDirty={samplesIsDirty}
                  subsamplesIsDirty={subsamplesIsDirty}
                />
              )}
            </div>
            <div className="row gx-0 h-100">
              <div className="col-12">
                <div ref={projectDataRef}>
                  {pageView === 'samples' || pageView === 'subsamples' ? (
                    <SampleTable
                      // fill to the rest of the screen minus the offset of the project data
                      height={window.innerHeight - 15 - (projectDataRef.current?.offsetTop || 300)}
                      readOnly={!(projectInfo && canEdit(user, projectInfo)) || currentHistoryId !== null}
                      // @ts-ignore: TODO: make this less confusing
                      data={
                        pageView === 'samples'
                          ? view !== undefined
                            ? viewData?._samples || []
                            : currentHistoryId !== null
                            ? projectHistoryView?._sample_dict || []
                            : newProjectSamples || []
                          : currentHistoryId !== null
                          ? projectHistoryView?._subsample_list || []
                          : newProjectSubsamples || []
                      }
                      onChange={onTableChange}
                    />
                  ) : (
                    <div className="border border-t">
                      <ProjectConfigEditor
                        readOnly={!(projectInfo && canEdit(user, projectInfo)) || currentHistoryId !== null}
                        value={currentHistoryId !== null ? projectHistoryView?._config || '' : newProjectConfig || ''}
                        setValue={(value) => setNewProjectConfig(value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Fragment>
        )}
        {/* Modals */}
        <LargeSampleTableModal
          namespace={namespace}
          show={showLargeSampleTableModal}
          onHide={() => setShowLargeSampleTableModal(false)}
        />
      </PageLayout>
    </div>
  );
};
