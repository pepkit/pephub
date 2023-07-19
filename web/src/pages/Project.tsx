import { FC, MouseEvent, forwardRef, useEffect, useState } from 'react';
import { Breadcrumb, Dropdown } from 'react-bootstrap';
import { useParams, useSearchParams } from 'react-router-dom';

import { Sample } from '../../types';
import { StatusIcon } from '../components/badges/status-icons';
import { SchemaTag } from '../components/forms/components/shema-tag';
import { PageLayout } from '../components/layout/page-layout';
import { ProjectDataNav } from '../components/layout/project-data-nav';
import { Markdown } from '../components/markdown/render';
// import { CompatibilityModal } from '../components/modals/compatibility-modal';
import { DeletePEPModal } from '../components/modals/delete-pep';
import { EditMetaMetadataModal } from '../components/modals/edit-meta-metadata';
import { ForkPEPModal } from '../components/modals/fork-pep';
import { ProjectAPIEndpointsModal } from '../components/modals/project-api-endpoints';
import { ProjectPageheaderPlaceholder } from '../components/placeholders/project-page-header';
import { ProjectConfigEditor } from '../components/project/project-config';
import { SampleTable } from '../components/tables/sample-table';
import { useConfigMutation } from '../hooks/mutations/useConfigMutation';
import { useSampleTableMutation } from '../hooks/mutations/useSampleTableMutation';
import { useSubsampleTableMutation } from '../hooks/mutations/useSubsampleTableMutation';
import { useProject } from '../hooks/queries/useProject';
import { useProjectConfig } from '../hooks/queries/useProjectConfig';
import { useSampleTable } from '../hooks/queries/useSampleTable';
import { useSubsampleTable } from '../hooks/queries/useSubsampleTable';
import { useValidation } from '../hooks/queries/useValidation';
import { useSession } from '../hooks/useSession';
import { canEdit } from '../utils/permissions';
import { downloadZip } from '../utils/project';
import { useTotalProjectChangeMutation } from '../hooks/mutations/useTotalProjectChangeMutation';

type ProjectView = 'samples' | 'subsamples' | 'config';

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
  const { user, jwt } = useSession();

  let { namespace, project } = useParams();
  namespace = namespace?.toLowerCase();
  // project = project?.toLowerCase();

  // get tag from url
  let [searchParams] = useSearchParams();
  const tag = searchParams.get('tag') || 'default';

  // fetch data
  const { data: projectInfo, isLoading: projectInfoIsLoading, error } = useProject(namespace, project || '', tag, jwt);
  const { data: projectSamples } = useSampleTable(namespace, project, tag, jwt);
  const { data: projectSubsamples } = useSubsampleTable(namespace, project, tag, jwt);
  const { data: projectConfig, isLoading: projectConfigIsLoading } = useProjectConfig(
    namespace,
    project || '',
    tag,
    jwt,
  );

  // state
  const [projectView, setProjectView] = useState<ProjectView>('samples');
  const [showDeletePEPModal, setShowDeletePEPModal] = useState(false);
  const [showForkPEPModal, setShowForkPEPModal] = useState(false);
  const [showAPIEndpointsModal, setShowAPIEndpointsModal] = useState(false);
  // const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [showEditMetaMetadataModal, setShowEditMetaMetadataModal] = useState(false);

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
  const configMutation = useConfigMutation(namespace || '', project || '', tag, jwt || '', newProjectConfig);
  const sampleTableMutation = useSampleTableMutation(namespace || '', project || '', tag, jwt || '', newProjectSamples);
  const subsampleTableMutation = useSubsampleTableMutation(
    namespace || '',
    project || '',
    tag,
    jwt || '',
    newProjectSubsamples,
  );
  const totalProjectMutation = useTotalProjectChangeMutation(
    namespace || '',
    project || '',
    tag,
    jwt || '',
    {
      config: newProjectConfig,
      samples: newProjectSamples,
      subsamples: newProjectSubsamples,
    }
  );

  const handleTotalProjectChange = async () => {
    await totalProjectMutation.mutateAsync();
    runValidation();
  }

  const handleProjectChange = async () => {
    if (configIsDirty) {
      await configMutation.mutateAsync();
      runValidation(); 
    }
    if (samplesIsDirty) {
      await sampleTableMutation.mutateAsync();
      runValidation(); 
    }
    if (subsamplesIsDirty) {
      await subsampleTableMutation.mutateAsync();
      runValidation(); 
    }
  };

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
      {/* breadcrumbs */}
      <div className="d-flex flex-row align-items-center justify-content-between px-4 mb-2 mt-4">
        <div className="d-flex flex-row align-items-center">
          <Breadcrumb className="fw-bold mt-1">
            <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
            <Breadcrumb.Item href={`/${namespace}`}>{namespace}</Breadcrumb.Item>
            <Breadcrumb.Item active>
              {project}:{tag}
            </Breadcrumb.Item>
            {projectInfo?.is_private ? (
              <span className="border py-1 ms-2 badge rounded-pill border-danger text-danger">Private</span>
            ) : null}
          </Breadcrumb>
          <div className="ms-2 mb-1">
          <a className="text-decoration-none" href={`https://schema.databio.org/${projectInfo?.pep_schema}.yaml`}>
            <SchemaTag schema={projectInfo?.pep_schema} />
          </a>
          </div>
        </div>
        <div className="d-flex flex-row align-items-start btn-g">
          <button
            className="me-1 btn btn-sm btn-outline-dark"
            onClick={() => downloadZip(namespace || '', project || '', tag, jwt)}
          >
            <i className="bi bi-file-earmark-zip me-1"></i>
            Download
          </button>
          <button className="me-1 btn btn-sm btn-outline-dark" onClick={() => setShowAPIEndpointsModal(true)}>
            <i className="bi bi-hdd-rack me-1"></i>
            API
          </button>
          {user && (
            <button className="me-1 btn btn-sm btn-outline-dark" onClick={() => setShowForkPEPModal(true)}>
              <i className="me-1 bi bi-bezier2"></i>
              Fork
            </button>
          )}
          {user && projectInfo && canEdit(user, projectInfo) && (
            <>
              <button className="me-1 btn btn-sm btn-outline-dark" onClick={() => setShowEditMetaMetadataModal(true)}>
                <i className="me-1 bi bi-pencil-square"></i>
                Edit
              </button>
              <button className="me-1 btn btn-sm btn-danger" onClick={() => setShowDeletePEPModal(true)}>
                <i className="me-1 bi bi-trash3"></i>
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      <div className="d-flex flex-row align-items-center px-4">
        <Markdown>{projectInfo?.description || 'No description'}</Markdown>
      </div>
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
                          configMutation.isLoading ||
                          sampleTableMutation.isLoading ||
                          subsampleTableMutation.isLoading ||
                          !(configIsDirty || samplesIsDirty || subsamplesIsDirty)
                        }
                        onClick={() => handleTotalProjectChange()}
                        className="fst-italic btn btn-sm btn-success me-1 mb-1 border-dark"
                      >
                        {configMutation.isLoading || sampleTableMutation.isLoading || subsampleTableMutation.isLoading
                          ? 'Saving...'
                          : 'Save'}
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
          <div>
            {projectView === 'samples' ? (
              <SampleTable
                // fill to the rest of the screen minus 300px
                height={window.innerHeight - 300}
                readOnly={!(projectInfo && canEdit(user, projectInfo))}
                data={newProjectSamples || []}
                onChange={(value) => setNewProjectSamples(value)}
              />
            ) : projectView === 'subsamples' ? (
              <>
                <SampleTable
                  // fill to the rest of the screen minus 300px
                  height={window.innerHeight - 300}
                  readOnly={!(projectInfo && canEdit(user, projectInfo))}
                  data={newProjectSubsamples || []}
                  onChange={(value) => setNewProjectSubsamples(value)}
                />
              </>
            ) : (
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
            )}
          </div>
        </div>
      </div>
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
      {/*<CompatibilityModal*/}
      {/*  namespace={namespace || ''}*/}
      {/*  project={project || ''}*/}
      {/*  tag={tag}*/}
      {/*  show={showCompatibilityModal}*/}
      {/*  onHide={() => setShowCompatibilityModal(false)}*/}
      {/*/>*/}
    </PageLayout>
  );
};
