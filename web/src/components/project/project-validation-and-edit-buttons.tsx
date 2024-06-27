import { Fragment, MouseEvent, forwardRef } from 'react';
import { Dropdown } from 'react-bootstrap';

import { Sample } from '../../../types';
import { useProjectPage } from '../../contexts/project-page-context';
import { useConfigMutation } from '../../hooks/mutations/useConfigMutation';
import { useTotalProjectChangeMutation } from '../../hooks/mutations/useTotalProjectChangeMutation';
import { useSession } from '../../hooks/useSession';
import { canEdit } from '../../utils/permissions';
import { StatusIcon } from '../badges/status-icons';
import { ProjectDataNav } from '../layout/project-data-nav';

type CustomToggleProps = {
  children?: React.ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

type ProjectValidationAndEditButtonsProps = {
  newProjectConfig: string;
  newProjectSamples: Sample[];
  newProjectSubsamples: Sample[];
  configIsDirty: boolean;
  samplesIsDirty: boolean;
  subsamplesIsDirty: boolean;
  view: string | undefined;
  setView: (view: string | undefined) => void;
  setNewProjectConfig: (config: string) => void;
  setNewProjectSamples: (samples: any) => void;
  setNewProjectSubsamples: (subsamples: any) => void;
};

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

export const ProjectValidationAndEditButtons = (props: ProjectValidationAndEditButtonsProps) => {
  const {
    newProjectSamples,
    newProjectSubsamples,
    newProjectConfig,
    configIsDirty,
    samplesIsDirty,
    subsamplesIsDirty,
    view,
    setView,
    setNewProjectConfig,
    setNewProjectSamples,
    setNewProjectSubsamples,
  } = props;

  const { user } = useSession();

  const {
    namespace,
    projectName,
    tag,
    shouldFetchSampleTable,
    projectAnnotationQuery,
    projectConfigQuery,
    projectViewsQuery,
    projectValidationQuery,
    sampleTableQuery,
    subSampleTableQuery,
  } = useProjectPage();

  const configMutation = useConfigMutation(namespace, projectName, tag, newProjectConfig);
  const totalProjectMutation = useTotalProjectChangeMutation(namespace, projectName, tag, {
    config: newProjectConfig,
    samples: newProjectSamples,
    subsamples: newProjectSubsamples,
  });

  const projectInfo = projectAnnotationQuery.data;
  const projectConfig = projectConfigQuery.data;
  const projectViews = projectViewsQuery?.data?.views || [];
  const validationResult = projectValidationQuery.data;
  const samples = sampleTableQuery?.data?.items || [];
  const subsamples = subSampleTableQuery.data?.items || [];

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

  const runValidation = () => {
    projectValidationQuery.refetch();
  };

  const handleTotalProjectChange = async () => {
    await totalProjectMutation.mutateAsync();
    runValidation();
  };

  return (
    <Fragment>
      <div className="h-100 flex-row d-flex align-items-end justify-content-between mx-3">
        <ProjectDataNav
          configIsDirty={configIsDirty}
          samplesIsDirty={samplesIsDirty}
          subsamplesIsDirty={subsamplesIsDirty}
          projectViewIsLoading={projectViewsQuery.isFetching}
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
                ) : (
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
    </Fragment>
  );
};
