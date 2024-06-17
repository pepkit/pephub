import { Fragment, MouseEvent, forwardRef, useEffect, useRef, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { useLocalStorage } from 'usehooks-ts';

import { Sample } from '../../types';
import { StatusIcon } from '../components/badges/status-icons';
import { PageLayout } from '../components/layout/page-layout';
import { ProjectDataNav } from '../components/layout/project-data-nav';
import { LargeSampleTableModal } from '../components/modals/sample-table-too-large';
import { ProjectPageheaderPlaceholder } from '../components/placeholders/project-page-header';
import { PopInterface } from '../components/pop/pop-interface';
import { ProjectConfigEditor } from '../components/project/project-config';
import { ProjectDescription } from '../components/project/project-page-description';
import { ProjectHeaderBar } from '../components/project/project-page-header-bar';
import { SampleTable } from '../components/tables/sample-table';
import { useProjectPage } from '../contexts/project-page-context';
import { useConfigMutation } from '../hooks/mutations/useConfigMutation';
import { useTotalProjectChangeMutation } from '../hooks/mutations/useTotalProjectChangeMutation';
import { useNamespaceStars } from '../hooks/queries/useNamespaceStars';
import { useView } from '../hooks/queries/useView';
import { useSession } from '../hooks/useSession';
import { dateStringToDateTime } from '../utils/dates';
import { getOS } from '../utils/etc';
import { canEdit } from '../utils/permissions';

interface CustomToggleProps {
  children?: React.ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

const ValiationToggle = forwardRef<HTMLAnchorElement, CustomToggleProps>(({ children, onClick }, ref) => (
  <a
    href=""
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      if (onClick) {
        onClick(e);
      }
    }}
    className="text-decoration-none"
  >
    {children}
  </a>
));

export const ProjectPage = () => {
  // user info
  const { user, jwt, login } = useSession();

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
    projectViewsQuery,
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
  const projectViews = projectViewsQuery.data?.views || [];
  const validationResult = projectValidationQuery.data;

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

  // reset config and samples
  const resetConfig = () => {
    setNewProjectConfig(projectConfig?.config || '');
  };
  const resetSamples = () => {
    setNewProjectSamples(samples);
  };
  const resetSubsamples = () => {
    setNewProjectSubsamples(subsamples);
  };

  // mutations for updating config and samples on the server
  const configMutation = useConfigMutation(namespace || '', projectName || '', tag, newProjectConfig);

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
      <div>
        <ProjectHeaderBar isStarred={isStarred} />
        <ProjectDescription />
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
                      <a
                        className="text-decoration-none ms-1"
                        href={`/${projectInfo?.forked_from.replace(':', '?tag=')}`}
                      >
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
      </div>
      {projectInfo?.pop && !forceTraditionalInterface ? (
        <PopInterface project={projectInfo} />
      ) : (
        <Fragment>
          <div className="mt-2 px-2">
            {projectAnnotationQuery.isFetching || projectInfo === undefined ? (
              <ProjectPageheaderPlaceholder />
            ) : (
              <>
                <div className="flex-row d-flex align-items-end justify-content-between mx-3">
                  <ProjectDataNav
                    configIsDirty={configIsDirty}
                    samplesIsDirty={samplesIsDirty}
                    subsamplesIsDirty={subsamplesIsDirty}
                    projectViewIsLoading={projectViewsQuery.isFetching}
                    projectViews={projectViews}
                    projectView={view}
                    setProjectView={setView}
                  />
                  {/* no matter what, only render if belonging to the user */}
                  {user && projectInfo && canEdit(user, projectInfo) ? (
                    <div className="d-flex flex-row align-items-center w-25 justify-content-end">
                      {/* <ValidationTooltip /> */}
                      {projectInfo?.pep_schema ? (
                        <div className="d-flex flex-row align-items-center mb-1 me-4">
                          {projectValidationQuery.isLoading || projectValidationQuery.isFetching ? (
                            <span>Validating...</span>
                          ) : validationResult?.valid ? (
                            <>
                              <Dropdown>
                                <div className="d-flex align-items-center">
                                  <Dropdown.Toggle as={ValiationToggle}>
                                    <StatusIcon className="text-2xl cursor-pointer" variant="success" />
                                  </Dropdown.Toggle>
                                  <span className="text-success">Valid</span>
                                </div>
                                <Dropdown.Menu className="border border-dark shadow-lg">
                                  <Dropdown.Header className="text-success">
                                    Your PEP is valid against {projectInfo?.pep_schema}
                                  </Dropdown.Header>
                                </Dropdown.Menu>
                              </Dropdown>
                            </>
                          ) : (
                            <>
                              <Dropdown>
                                <div className="d-flex align-items-center">
                                  <Dropdown.Toggle as={ValiationToggle}>
                                    <StatusIcon className="text-2xl cursor-pointer" variant="danger" />
                                  </Dropdown.Toggle>
                                  <span className="text-danger">Invalid</span>
                                </div>
                                <Dropdown.Menu className="border border-dark shadow-lg">
                                  <Dropdown.Header>
                                    {validationResult?.error_type === 'Schema' ? (
                                      <span className="text-danger">Schema is invalid</span>
                                    ) : (
                                      <>
                                        <span className="text-danger fw-bold">
                                          Your PEP is invalid against {projectInfo?.pep_schema}
                                        </span>
                                        <p className="mb-0 fw-bold">
                                          <span className="text-danger">
                                            Errors found in {validationResult?.error_type}
                                            {': '}
                                          </span>
                                        </p>
                                        {validationResult?.errors.map((error, index) => (
                                          <Dropdown.Header className="text-danger" key={index}>
                                            <i className="bi bi bi-exclamation-triangle me-2"></i>
                                            {error}
                                          </Dropdown.Header>
                                        ))}
                                      </>
                                    )}
                                  </Dropdown.Header>
                                </Dropdown.Menu>
                              </Dropdown>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="d-flex flex-row align-items-center mb-1 me-4">
                          <>
                            <div className="d-flex align-items-center">
                              <StatusIcon className="text-2xl" variant="warning" />
                              <span>Add schema to PEP to validate</span>
                            </div>
                          </>
                        </div>
                      )}
                      <div className="px-1">
                        {shouldFetchSampleTable && !view && (
                          <Fragment>
                            <button
                              disabled={
                                configMutation.isPending ||
                                totalProjectMutation.isPending ||
                                !(configIsDirty || samplesIsDirty || subsamplesIsDirty) ||
                                !shouldFetchSampleTable ||
                                !!view
                              }
                              onClick={() => handleTotalProjectChange()}
                              className="fst-italic btn btn-sm btn-success me-1 mb-1 border-dark"
                            >
                              {configMutation.isPending || totalProjectMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              className="fst-italic btn btn-sm btn-outline-dark me-1 mb-1"
                              onClick={() => {
                                resetConfig();
                                resetSamples();
                                resetSubsamples();
                              }}
                              disabled={!(configIsDirty || samplesIsDirty || subsamplesIsDirty)}
                            >
                              Discard
                            </button>
                          </Fragment>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
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
