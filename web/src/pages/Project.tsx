import { FC, Fragment, MouseEvent, forwardRef, useEffect, useRef, useState } from 'react';
import { Breadcrumb, Dropdown } from 'react-bootstrap';
import { useParams, useSearchParams } from 'react-router-dom';

import { Sample } from '../../types';
import { StatusIcon } from '../components/badges/status-icons';
import { SchemaTag } from '../components/forms/components/shema-tag';
import { PageLayout } from '../components/layout/page-layout';
import { ProjectDataNav } from '../components/layout/project-data-nav';
import { Markdown } from '../components/markdown/render';
import { AddToPOPModal } from '../components/modals/add-to-pop';
import { DeletePEPModal } from '../components/modals/delete-pep';
import { EditMetaMetadataModal } from '../components/modals/edit-meta-metadata';
import { ForkPEPModal } from '../components/modals/fork-pep';
import { ProjectAPIEndpointsModal } from '../components/modals/project-api-endpoints';
import { ProjectPageheaderPlaceholder } from '../components/placeholders/project-page-header';
import { PopInterface } from '../components/pop/pop-interface';
import { ProjectConfigEditor } from '../components/project/project-config';
import { SampleTable } from '../components/tables/sample-table';
import { useAddStar } from '../hooks/mutations/useAddStar';
import { useConfigMutation } from '../hooks/mutations/useConfigMutation';
import { useRemoveStar } from '../hooks/mutations/useRemoveStar';
import { useTotalProjectChangeMutation } from '../hooks/mutations/useTotalProjectChangeMutation';
import { useNamespaceStars } from '../hooks/queries/useNamespaceStars';
import { useProjectAnnotation } from '../hooks/queries/useProjectAnnotation';
import { useProjectConfig } from '../hooks/queries/useProjectConfig';
import { useSampleTable } from '../hooks/queries/useSampleTable';
import { useSubsampleTable } from '../hooks/queries/useSubsampleTable';
import { useValidation } from '../hooks/queries/useValidation';
import { useSession } from '../hooks/useSession';
import { dateStringToDate, dateStringToDateTime } from '../utils/dates';
import { copyToClipboard, getOS, numberWithCommas } from '../utils/etc';
import { canEdit } from '../utils/permissions';
import { downloadZip } from '../utils/project';

type ProjectView = 'samples' | 'subsamples' | 'config';

const MAX_DESC_HEIGHT = 200;
const MAX_SAMPLE_COUNT = 5_000;
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

export const ProjectPage: FC = () => {
  // user info
  const { user, jwt, login } = useSession();

  // os info
  const os = getOS();

  let { namespace, project } = useParams();
  namespace = namespace?.toLowerCase();
  // project = project?.toLowerCase();

  // get tag from url
  let [searchParams] = useSearchParams();
  const tag = searchParams.get('tag') || 'default';
  const fork = searchParams.get('fork');

  // users stars - determine if they have this PEP starred
  const { data: userStars } = useNamespaceStars(user?.login || '', {}, true);
  const isStarred =
    userStars?.map((star) => `${star.namespace}/${star.name}:${star.tag}`).includes(`${namespace}/${project}:${tag}`) ||
    false;

  const starAddMutation = useAddStar(user?.login || '', namespace!, project!, tag);
  const starRemoveMutation = useRemoveStar(user?.login || '', namespace!, project!, tag);

  // fetch data
  const {
    data: projectInfo,
    isLoading: projectInfoIsLoading,
    error,
  } = useProjectAnnotation(namespace, project || '', tag);
  const { data: projectSamples } = useSampleTable(namespace, project, tag);
  const { data: projectSubsamples } = useSubsampleTable(namespace, project, tag);
  const { data: projectConfig, isLoading: projectConfigIsLoading } = useProjectConfig(namespace, project || '', tag);

  // state
  const [projectView, setProjectView] = useState<ProjectView>('samples');
  const [showDeletePEPModal, setShowDeletePEPModal] = useState(false);
  const [showForkPEPModal, setShowForkPEPModal] = useState(false);
  const [showAPIEndpointsModal, setShowAPIEndpointsModal] = useState(false);
  const [showEditMetaMetadataModal, setShowEditMetaMetadataModal] = useState(false);
  const [showAddToPOPModal, setShowAddToPOPModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [forceTraditionalInterface, setForceTraditionalInterface] = useState(false); // let users toggle between PEP and POP interfaces

  // state for editing config, samples, and subsamples
  const [newProjectConfig, setNewProjectConfig] = useState(projectConfig?.config || '');
  const [newProjectSamples, setNewProjectSamples] = useState<Sample[]>(projectSamples?.items || []);
  const [newProjectSubsamples, setNewProjectSubsamples] = useState<Sample[]>(projectSubsamples?.items || []);

  const {
    data: validationResult,
    isLoading: isValidationLoading,
    isFetching: isValidationFetching,
    refetch,
  } = useValidation({
    pep_registry: `${namespace}/${project}:${tag}`,
    schema: projectInfo?.pep_schema || 'pep/2.0.0', // default to basic pep 2.0.0 schema
    schema_registry: projectInfo?.pep_schema,
    enabled: namespace && project && tag && projectInfo ? true : false,
  });

  const runValidation = () => {
    refetch();
  };

  // watch for query changes to update newProjectConfig and newProjectSamples
  useEffect(() => {
    setNewProjectConfig(projectConfig?.config || '');
    setNewProjectSamples(projectSamples?.items || []);
    setNewProjectSubsamples(projectSubsamples?.items || []);
  }, [projectConfig, projectSamples, projectSubsamples]);

  // watch for the fork query param to open the fork modal
  useEffect(() => {
    if (fork) {
      if (user) {
        setShowForkPEPModal(true);
      } else {
        login();
      }
    }
  }, [fork]);

  // check if config or samples are dirty
  const configIsDirty = newProjectConfig !== projectConfig?.config;

  // use JSON stringify to compare arrays
  const samplesIsDirty = JSON.stringify(newProjectSamples) !== JSON.stringify(projectSamples?.items || []);
  const subsamplesIsDirty = JSON.stringify(newProjectSubsamples) !== JSON.stringify(projectSubsamples?.items || []);

  // reset config and samples
  const resetConfig = () => {
    setNewProjectConfig(projectConfig?.config || '');
  };
  const resetSamples = () => {
    setNewProjectSamples(projectSamples?.items || []);
  };
  const resetSubsamples = () => {
    setNewProjectSubsamples(projectSubsamples?.items || []);
  };

  // mutations for updating config and samples on the server
  const configMutation = useConfigMutation(namespace || '', project || '', tag, newProjectConfig);

  const totalProjectMutation = useTotalProjectChangeMutation(namespace || '', project || '', tag, {
    config: newProjectConfig,
    samples: newProjectSamples,
    subsamples: newProjectSubsamples,
  });

  const handleTotalProjectChange = async () => {
    await totalProjectMutation.mutateAsync();
    runValidation();
  };

  const projectHash = projectInfo?.pep_schema?.replace(/\//g, '/#/');
  const projectDataRef = useRef<HTMLDivElement>(null);
  const projectDescriptionRef = useRef<HTMLDivElement>(null);
  const showMoreButton = projectDescriptionRef.current?.clientHeight! >= MAX_DESC_HEIGHT;
  const [showMoreDescription, setShowMoreDescription] = useState(false);

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
      if (ctrlKey && e.key === 's') {
        e.preventDefault();
        if (configIsDirty || samplesIsDirty || subsamplesIsDirty) {
          handleTotalProjectChange();
        }
      }
    });
  }, []);

  if (error) {
    return (
      <PageLayout fullWidth footer={false} title={`${namespace}/${project}`}>
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
    <PageLayout fullWidth footer={false} title={`${namespace}/${project}`}>
      <div>
        <div className="d-flex flex-row align-items-start justify-content-between px-4 mb-2 mt-4">
          <div className="d-flex flex-row align-items-center">
            <Breadcrumb className="fw-bold mt-1">
              <Breadcrumb.Item href="/">home</Breadcrumb.Item>
              <Breadcrumb.Item href={`/${namespace}`}>{namespace}</Breadcrumb.Item>
              <Breadcrumb.Item active>
                {project}:{tag}
              </Breadcrumb.Item>
              {projectInfo?.is_private && (
                <li>
                  <span className="border py-1 ms-2 badge rounded-pill border-danger text-danger">Private</span>
                </li>
              )}
            </Breadcrumb>
            <div className="ms-2 mb-1">
              <a className="text-decoration-none" href={`https://schema.databio.org/#/${projectHash}`}>
                <SchemaTag schema={projectInfo?.pep_schema} />
              </a>
            </div>
          </div>
          <div className="d-flex flex-row align-items-center gap-1">
            <div className="d-flex flex-row align-items-center">
              <div className="border border-dark shadow-sm rounded-1 ps-2 d-flex align-items-center">
                <span className="text-sm fw-bold">
                  {projectInfo
                    ? `${projectInfo?.namespace}/${projectInfo?.name}:${projectInfo?.tag || 'default'}`
                    : 'Loading'}
                </span>
                <button
                  className="btn btn-sm btn-link-dark shadow-none ms-1 pe-2"
                  onClick={() => {
                    copyToClipboard(`${projectInfo?.namespace}/${projectInfo?.name}:${projectInfo?.tag || 'default'}`);
                    setCopied(true);
                    setTimeout(() => {
                      setCopied(false);
                    }, 1000);
                  }}
                >
                  {copied ? <i className="bi bi-check"></i> : <i className="bi bi-clipboard" />}
                </button>
              </div>
            </div>
            <Dropdown>
              <Dropdown.Toggle size="sm" variant="dark">
                <i className="bi bi-gear-fill me-1"></i>
                More
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => downloadZip(namespace || '', project || '', tag, jwt)}>
                  <i className="bi bi-file-earmark-zip me-1"></i>
                  Download
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setShowAPIEndpointsModal(true)}>
                  <i className="bi bi-hdd-rack me-1"></i>
                  API
                </Dropdown.Item>
                <Fragment>
                  {user && (
                    <Fragment>
                      <Dropdown.Item onClick={() => setShowForkPEPModal(true)}>
                        <i className="me-1 bi bi-bezier2"></i>
                        Fork
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setShowAddToPOPModal(true)}>
                        <i className="me-1 bi bi-plus-circle"></i>
                        Add to POP
                      </Dropdown.Item>
                    </Fragment>
                  )}
                </Fragment>
                <Fragment>
                  {projectInfo?.pop && (
                    <Fragment>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => setForceTraditionalInterface(!forceTraditionalInterface)}>
                        <i className="me-1 bi bi-layout-text-sidebar-reverse"></i>
                        {forceTraditionalInterface ? 'View as POP' : 'View as PEP'}
                      </Dropdown.Item>
                    </Fragment>
                  )}
                </Fragment>
                <Fragment>
                  {user && projectInfo && canEdit(user, projectInfo) && (
                    <Fragment>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => setShowEditMetaMetadataModal(true)}>
                        <i className="me-1 bi bi-pencil-square"></i>
                        Edit
                      </Dropdown.Item>
                      <Dropdown.Item className="text-danger" onClick={() => setShowDeletePEPModal(true)}>
                        <i className="me-1 bi bi-trash3"></i>
                        Delete
                      </Dropdown.Item>
                    </Fragment>
                  )}
                </Fragment>
              </Dropdown.Menu>
            </Dropdown>
            <button
              className="btn btn-outline-dark btn-sm"
              disabled={starAddMutation.isPending || starRemoveMutation.isPending}
              onClick={() => {
                if (isStarred) {
                  starRemoveMutation.mutate();
                } else {
                  starAddMutation.mutate();
                }
              }}
            >
              {isStarred ? (
                <Fragment>
                  <span className="text-primary">
                    <i className="me-1 bi bi-star-fill"></i>
                    Starred
                    <span className="px-2 border border-dark rounded-pill text-dark ms-1 bg-dark bg-opacity-10">
                      {numberWithCommas(projectInfo?.stars_number || 0)}
                    </span>
                  </span>
                </Fragment>
              ) : (
                <Fragment>
                  <span>
                    <i className="me-1 bi bi-star"></i>
                    Star
                    <span className="px-2 border border-dark rounded-pill text-dark ms-1 bg-dark bg-opacity-10">
                      {numberWithCommas(projectInfo?.stars_number || 0)}
                    </span>
                  </span>
                </Fragment>
              )}
            </button>
          </div>
        </div>
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
        <div className="px-4">
          <div className="d-flex flex-row align-items-center text-muted mt-1">
            <small className="d-flex flex-row align-items-center justify-content-between w-100">
              <span className="me-3">
                <i className="bi bi-calendar3"></i>
                <span className="mx-1">Created:</span>
                <span id="project-submission-date">{dateStringToDate(projectInfo?.submission_date || '')}</span>
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
            {projectInfoIsLoading || projectInfo === undefined ? (
              <ProjectPageheaderPlaceholder />
            ) : (
              <>
                <div className="flex-row d-flex align-items-end justify-content-between mx-3">
                  <ProjectDataNav
                    projectView={projectView}
                    setProjectView={(view) => setProjectView(view)}
                    configIsDirty={configIsDirty}
                    samplesIsDirty={samplesIsDirty}
                    subsamplesIsDirty={subsamplesIsDirty}
                  />
                  {/* no matter what, only render if belonging to the user */}
                  {user && projectInfo && canEdit(user, projectInfo) ? (
                    <div className="d-flex flex-row align-items-center">
                      {/* <ValidationTooltip /> */}
                      {projectInfo?.pep_schema ? (
                        <div className="d-flex flex-row align-items-center mb-1 me-4">
                          {isValidationLoading || isValidationFetching ? (
                            <>
                              <span>Validating...</span>
                            </>
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
                        <>
                          <button
                            disabled={
                              configMutation.isPending ||
                              totalProjectMutation.isPending ||
                              !(configIsDirty || samplesIsDirty || subsamplesIsDirty)
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
                        </>
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
                {projectView === 'samples' ? (
                  <SampleTable
                    // fill to the rest of the screen minus the offset of the project data
                    height={window.innerHeight - 15 - (projectDataRef.current?.offsetTop || 300)}
                    readOnly={!(projectInfo && canEdit(user, projectInfo))}
                    data={newProjectSamples || []}
                    onChange={(value) => setNewProjectSamples(value)}
                  />
                ) : projectView === 'subsamples' ? (
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
                        projectConfigIsLoading
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
      <EditMetaMetadataModal
        show={showEditMetaMetadataModal}
        onHide={() => setShowEditMetaMetadataModal(false)}
        namespace={namespace || ''}
        project={project || ''}
        tag={tag}
      />
      <ProjectAPIEndpointsModal
        show={showAPIEndpointsModal}
        onHide={() => setShowAPIEndpointsModal(false)}
        namespace={namespace || ''}
        project={project || ''}
        tag={tag}
      />
      <DeletePEPModal
        show={showDeletePEPModal}
        onHide={() => setShowDeletePEPModal(false)}
        namespace={namespace || ''}
        project={project || ''}
        tag={tag}
        redirect={`/${user?.login}`}
      />
      <ForkPEPModal
        show={showForkPEPModal}
        onHide={() => setShowForkPEPModal(false)}
        namespace={namespace || ''}
        project={project || ''}
        description={projectInfo?.description || ''}
        tag={tag}
      />
      <AddToPOPModal
        show={showAddToPOPModal}
        onHide={() => {
          setShowAddToPOPModal(false);
        }}
        namespace={namespace!}
        project={project!}
        tag={tag}
      />
    </PageLayout>
  );
};
