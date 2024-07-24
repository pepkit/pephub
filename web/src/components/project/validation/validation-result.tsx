import { useState } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

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

  let wrapperClassName = 'py-1 px-2 rounded-1 bg-opacity-10 validation-button';
  if (isValidating) {
    wrapperClassName += ' border border-warning text-warning bg-warning';
  } else if (validationResult?.valid) {
    wrapperClassName += ' border border-success text-success bg-success';
  } else {
    wrapperClassName += ' border border-danger text-danger bg-danger';
  }

  return (
    <div className="d-flex flex-row align-items-center rounded-1 shadow-sm">
      <OverlayTrigger
        overlay={
          <Tooltip id="validation" style={{position:"fixed"}}>
            As you edit your project below, it will be validated against the schema currently selected for it.
          </Tooltip>
        }
        delay={{ show: 250, hide: 500 }}
        trigger={["hover"]}
      >
        <button
          disabled={isValidating}
          onClick={() => {
            setValidationModalIsOpen(true);
          }}
          className={wrapperClassName}
        >
          <div className="d-flex flex-row align-items-center gap-2 text-sm py-0">
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
      </OverlayTrigger>
      <ValidationResultModal
        show={validationModalIsOpen}
        onHide={() => setValidationModalIsOpen(false)}
        validationResult={validationResult}
        currentSchema={schemaRegistry}
      />
    </div>
  );
};
