import { Modal } from 'react-bootstrap';
import { Fragment } from 'react/jsx-runtime';

import { useValidation } from '../../hooks/queries/useValidation';

interface Props {
  show: boolean;
  onHide: () => void;
  validationResult: ReturnType<typeof useValidation>['data'];
}

export const ValidationResultModal = (props: Props) => {
  const { show, onHide, validationResult } = props;
  return (
    <Modal
      centered
      animation={false}
      show={show}
      onHide={() => {
        onHide();
      }}
    >
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">
          {validationResult?.valid ? (
            <span className="text-success d-flex align-items-center gap-1">
              <i className="bi bi-check-circle"></i>
              Validation Passed
            </span>
          ) : (
            <span className="text-danger d-flex align-items-center gap-1">
              <i className="bi bi-exclamation-circle"></i>
              Validation Failed
            </span>
          )}
        </h1>
      </Modal.Header>
      <Modal.Body>
        {validationResult?.valid ? (
          <p>Your PEP is valid against the schema.</p>
        ) : (
          <Fragment>
            <p>You PEP is invalid against the schema.</p>
            <pre>
              <code>{JSON.stringify(validationResult, null, 2)}</code>
            </pre>
          </Fragment>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-dark" onClick={onHide}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};
