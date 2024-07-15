import { Fragment, MouseEvent, forwardRef } from 'react';

import { useProjectPage } from '../../contexts/project-page-context';
import { useSession } from '../../contexts/session-context';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { useValidation } from '../../hooks/queries/useValidation';
import { canEdit } from '../../utils/permissions';
import { StatusIcon } from '../badges/status-icons';
import { ProjectDataNav } from '../layout/project-data-nav';

type CustomToggleProps = {
  children?: React.ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

type ProjectValidationAndEditButtonsProps = {
  isDirty: boolean;
  isUpdatingProject: boolean;
  reset: () => void;
  handleSubmit: () => void;
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
  const { isDirty, isUpdatingProject, reset, handleSubmit } = props;
  const { user } = useSession();

  const { namespace, projectName, tag } = useProjectPage();

  // const projectValidationQuery = useValidation({
  //   pepRegistry: `${namespace}/${projectName}:${tag}`,
  //   schema: projectAnnotationQuery.data?.pep_schema || 'pep/2.0.0', // default to basic pep 2.0.0 schema
  // });
  const { data: projectInfo } = useProjectAnnotation(namespace, projectName, tag);
  // const validationResult = projectValidationQuery.data;

  const userHasOwnership = user && projectInfo && canEdit(user, projectInfo);

  return (
    <Fragment>
      <div className="h-100 flex-row d-flex align-items-end justify-content-between mx-3">
        <ProjectDataNav />
        {/* no matter what, only render if belonging to the user */}
        {userHasOwnership ? (
          <div className="h-100 d-flex flex-row align-items-center w-25 justify-content-end">
            {/* <ValidationTooltip /> */}
            {projectInfo?.pep_schema ? (
              <div className="d-flex flex-row align-items-center me-4">
                {/* {projectValidationQuery.isLoading || projectValidationQuery.isFetching ? (
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
                )} */}
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
              <Fragment>
                <button
                  disabled={isUpdatingProject || !isDirty}
                  onClick={() => handleSubmit()}
                  className="fst-italic btn btn-sm btn-success me-1 border-dark"
                >
                  {isUpdatingProject ? 'Saving...' : 'Save'}
                </button>
                <button
                  disabled={isUpdatingProject || !isDirty}
                  className="fst-italic btn btn-sm btn-outline-dark bg-white"
                  onClick={() => reset()}
                >
                  Discard
                </button>
              </Fragment>
            </div>
          </div>
        ) : null}
      </div>
    </Fragment>
  );
};
