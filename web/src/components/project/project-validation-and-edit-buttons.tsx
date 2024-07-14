import { Fragment, MouseEvent, forwardRef } from 'react';
import { Dropdown } from 'react-bootstrap';

import { Sample } from '../../../types';
import { useProjectPage } from '../../contexts/project-page-context';
import { useSession } from '../../contexts/session-context';
import { useTotalProjectChangeMutation } from '../../hooks/mutations/useTotalProjectChangeMutation';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { useProjectConfig } from '../../hooks/queries/useProjectConfig';
import { useProjectViews } from '../../hooks/queries/useProjectViews';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { useSubsampleTable } from '../../hooks/queries/useSubsampleTable';
import { useValidation } from '../../hooks/queries/useValidation';
import { canEdit } from '../../utils/permissions';
import { StatusIcon } from '../badges/status-icons';
import { ProjectDataNav } from '../layout/project-data-nav';

type CustomToggleProps = {
  children?: React.ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

type ProjectValidationAndEditButtonsProps = {
  projectAnnotationQuery: ReturnType<typeof useProjectAnnotation>;
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
    projectAnnotationQuery,
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

  const { namespace, projectName, tag, shouldFetchSampleTable } = useProjectPage();

  const projectConfigQuery = useProjectConfig(namespace, projectName, tag);
  const projectValidationQuery = useValidation({
    pepRegistry: `${namespace}/${projectName}:${tag}`,
    schema: projectAnnotationQuery.data?.pep_schema || 'pep/2.0.0', // default to basic pep 2.0.0 schema
  });
  const projectViewsQuery = useProjectViews(namespace, projectName, tag);
  const sampleTableQuery = useSampleTable({
    namespace,
    project: projectName,
    tag,
    enabled: projectAnnotationQuery.data === undefined ? false : shouldFetchSampleTable,
  });
  const subSampleTableQuery = useSubsampleTable(namespace, projectName, tag);

  const { isPending: isUpdatingProject, submit: submitNewProject } = useTotalProjectChangeMutation(
    namespace,
    projectName,
    tag,
  );

  const projectInfo = projectAnnotationQuery.data;
  const projectConfig = projectConfigQuery.data;
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

  const handleTotalProjectChange = () => {
    submitNewProject({
      config: newProjectConfig,
      samples: newProjectSamples,
      subsamples: newProjectSubsamples,
    });
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
          <div className="h-100 d-flex flex-row align-items-center w-25 justify-content-end">
            {/* <ValidationTooltip /> */}
            {projectInfo?.pep_schema ? (
              <div className="d-flex flex-row align-items-center me-4">
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
            <div className="ps-1">
              {shouldFetchSampleTable && !view && (
                <Fragment>
                  <button
                    disabled={
                      isUpdatingProject ||
                      !(configIsDirty || samplesIsDirty || subsamplesIsDirty) ||
                      !shouldFetchSampleTable ||
                      !!view
                    }
                    onClick={() => handleTotalProjectChange()}
                    className="fst-italic btn btn-sm btn-success me-1 border-dark"
                  >
                    {isUpdatingProject ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="fst-italic btn btn-sm btn-outline-dark bg-white"
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
