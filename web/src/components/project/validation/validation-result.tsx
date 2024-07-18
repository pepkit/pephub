import { useState } from 'react';

import { useValidation } from '../../../hooks/queries/useValidation';
import { ValidationResultModal } from '../../modals/validation-result';

type Props = {
  schemaRegistry: string;
  isValidating: boolean;
  validationResult: ReturnType<typeof useValidation>['data'];
};

export const ValidationResult = (props: Props) => {
  const { validationResult, isValidating, schemaRegistry } = props;

  const [validationModalIsOpen, setValidationModalIsOpen] = useState(false);

  let wrapperClassName = 'py-1 px-2 rounded shadow-md bg-opacity-10 validation-button';
  if (isValidating) {
    wrapperClassName += ' border border-warning text-warning bg-warning';
  } else if (validationResult?.valid) {
    wrapperClassName += ' border border-success text-success bg-success';
  } else {
    wrapperClassName += ' border border-danger text-danger bg-danger';
  }

  return (
    <div className="d-flex flex-row align-items-center">
      <button
        disabled={isValidating}
        onClick={() => {
          setValidationModalIsOpen(true);
        }}
        className={wrapperClassName}
      >
        <div className="d-flex flex-row align-items-center gap-2">
          {isValidating ? (
            <span className="bg-warning text-warning rounded-pill validation-badge"></span>
          ) : validationResult?.valid ? (
            <span className="bg-success text-success rounded-pill validation-badge"></span>
          ) : (
            <span className="bg-danger text-danger rounded-pill validation-badge"></span>
          )}
          {schemaRegistry}
        </div>
      </button>
      <ValidationResultModal
        show={validationModalIsOpen}
        onHide={() => setValidationModalIsOpen(false)}
        validationResult={validationResult}
      />
    </div>
  );
};
