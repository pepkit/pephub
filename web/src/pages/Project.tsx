import { Fragment, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocalStorage } from 'usehooks-ts';

import { Sample } from '../../types';
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
import { useConfigMutation } from '../hooks/mutations/useConfigMutation';
import { useTotalProjectChangeMutation } from '../hooks/mutations/useTotalProjectChangeMutation';
import { useNamespaceStars } from '../hooks/queries/useNamespaceStars';
import { useView } from '../hooks/queries/useView';
import { useSession } from '../hooks/useSession';
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
  const {
    namespace,
    projectName,
    tag,
    projectAnnotationQuery,
    sampleTableQuery,
    subSampleTableQuery,
    projectConfigQuery,
    projectValidationQuery,
    shouldFetchSampleTable,
    pageView,
    forceTraditionalInterface,
    MAX_SAMPLE_COUNT,
  } = useProjectPage();

  const { starsQuery } = useNamespaceStars(user?.login || '/', {}, true);

  const isStarred =
    starsQuery.data?.find(
      (star) =>
        star.namespace === projectAnnotationQuery.data?.namespace && star.name === projectAnnotationQuery.data?.name,
    ) !== undefined;

  // pull out data for easier access
  const projectInfo = projectAnnotationQuery.data;
  const projectConfig = projectConfigQuery.data;
  const samples = sampleTableQuery?.data?.items || [];
  const subsamples = subSampleTableQuery.data?.items || [];

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
  const [newProjectConfig, setNewProjectConfig] = useState(projectConfig?.config || '');
  const [newProjectSamples, setNewProjectSamples] = useState<Sample[]>(samples);
  const [newProjectSubsamples, setNewProjectSubsamples] = useState<Sample[]>(subSampleTableQuery.data?.items || []);

  const runValidation = () => {
    projectValidationQuery.refetch();
  };

  // watch for query changes to update newProjectConfig and newProjectSamples
  useEffect(() => {
    setNewProjectConfig(projectConfig?.config || '');
    setNewProjectSamples(samples);
    setNewProjectSubsamples(subsamples);
  }, [projectAnnotationQuery, subSampleTableQuery, subSampleTableQuery]);

  useEffect(() => {
    if (projectInfo !== undefined && hideLargeSampleTableModal === 'false') {
      setShowLargeSampleTableModal(!shouldFetchSampleTable);
    }
  }, [shouldFetchSampleTable, projectAnnotationQuery.data]);

  // check if config or samples are dirty
  const configIsDirty = newProjectConfig !== projectConfig?.config;

  // use JSON stringify to compare arrays
  const samplesIsDirty = JSON.stringify(newProjectSamples) !== JSON.stringify(samples);
  const subsamplesIsDirty = JSON.stringify(newProjectSubsamples) !== JSON.stringify(subsamples);

  const totalProjectMutation = useTotalProjectChangeMutation(namespace || '', projectName || '', tag, {
    config: newProjectConfig,
    samples: newProjectSamples,
    subsamples: newProjectSubsamples,
  });

  const handleTotalProjectChange = async () => {
    await totalProjectMutation.mutateAsync();
    runValidation();
  };

  const projectDataRef = useRef<HTMLDivElement>(null);

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
          handleTotalProjectChange();
        }
      }
    });
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
    <PageLayout fullWidth footer={false} title={`${namespace}/${projectName}`}>
      <ProjectHeaderBar isStarred={isStarred} />
      <ProjectDescription />
      <ProjectInfoFooter />
      {projectInfo?.pop && !forceTraditionalInterface ? (
        <PopInterface project={projectInfo} />
      ) : (
        <Fragment>
          <div className="mt-2 px-2">
            {projectAnnotationQuery.isFetching || projectInfo === undefined ? (
              <ProjectPageheaderPlaceholder />
            ) : (
              <ProjectValidationAndEditButtons
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
                {pageView === 'samples' ? (
                  <SampleTable
                    // fill to the rest of the screen minus the offset of the project data
                    height={window.innerHeight - 15 - (projectDataRef.current?.offsetTop || 300)}
                    readOnly={!(projectInfo && canEdit(user, projectInfo))}
                    // @ts-ignore: TODO: fix this, the model is just messed up
                    data={view !== undefined ? viewData?._samples || [] : newProjectSamples || []}
                    onChange={(value) => setNewProjectSamples(value)}
                  />
                ) : pageView === 'subsamples' ? (
                  <>
                    <SampleTable
                      // fill to the rest of the screen minus the offset of the project data
                      height={window.innerHeight - 15 - (projectDataRef.current?.offsetTop || 300)}
                      readOnly={
                        !(projectInfo && canEdit(user, projectInfo)) || newProjectSamples?.length >= MAX_SAMPLE_COUNT
                      }
                      data={newProjectSubsamples || []}
                      onChange={(value) => setNewProjectSubsamples(value)}
                    />
                  </>
                ) : (
                  <div className="border border-t">
                    <ProjectConfigEditor
                      readOnly={!(projectInfo && canEdit(user, projectInfo))}
                      value={
                        projectConfigQuery.isLoading
                          ? 'Loading.'
                          : projectConfig?.config
                          ? newProjectConfig
                          : 'No config file found.'
                      }
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
  );
};
