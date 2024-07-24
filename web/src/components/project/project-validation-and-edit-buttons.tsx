import { Fragment } from 'react';

import { useProjectPage } from '../../contexts/project-page-context';
import { useSession } from '../../contexts/session-context';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { useValidation } from '../../hooks/queries/useValidation';
import { canEdit } from '../../utils/permissions';
import { StatusIcon } from '../badges/status-icons';
import { ProjectDataNav } from '../layout/project-data-nav';
import { ValidationTooltip } from '../tooltips/validation-tooltip';
import { ValidationResult } from './validation/validation-result';

type ProjectValidationAndEditButtonsProps = {
  isDirty: boolean;
  isUpdatingProject: boolean;
  reset: () => void;
  handleSubmit: () => void;
};

export const ProjectValidationAndEditButtons = (props: ProjectValidationAndEditButtonsProps) => {
  const { isDirty, isUpdatingProject, reset, handleSubmit } = props;
  const { user } = useSession();

  const { namespace, projectName, tag } = useProjectPage();

  const { data: projectInfo } = useProjectAnnotation(namespace, projectName, tag);
  const projectValidationQuery = useValidation({
    pepRegistry: `${namespace}/${projectName}:${tag}`,
    schema_registry: projectInfo?.pep_schema || 'pep/2.0.0', // default to basic pep 2.0.0 schema
    enabled: !!projectInfo?.pep_schema,
  });

  const validationResult = projectValidationQuery.data;

  const userHasOwnership = user && projectInfo && canEdit(user, projectInfo);

  return (
    <Fragment>
      <div className="h-100 flex-row d-flex align-items-end justify-content-between mx-3">
        <ProjectDataNav />
        {/* no matter what, only render if belonging to the user */}
        {userHasOwnership ? (
          <div className="h-100 d-flex flex-row align-items-center w-50 justify-content-end">
            <ValidationTooltip />
            {projectInfo?.pep_schema ? (
              <ValidationResult
                schemaRegistry={projectInfo.pep_schema}
                isValidating={projectValidationQuery.isLoading}
                validationResult={validationResult}
              />
            ) : (
              <div className="d-flex flex-row align-items-center mb-1 me-4">
                <>
                  <div className="d-flex align-items-center">
                    <StatusIcon className="text-2xl" variant="warning" />
                    <span>No schema</span>
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
