import { Fragment } from 'react';
import { Modal } from 'react-bootstrap';
import { Controller, useForm } from 'react-hook-form';

import { useProjectPage } from '../../contexts/project-page-context';
import { useEditProjectMetaMutation } from '../../hooks/mutations/useEditProjectMetaMutation';
import { useValidation } from '../../hooks/queries/useValidation';
import { SchemaDropdown } from '../forms/components/schemas-databio-dropdown';

type Props = {
  show: boolean;
  onHide: () => void;
  validationResult: ReturnType<typeof useValidation>['data'];
  currentSchema: string | undefined;
};

type FormProps = {
  schema: string;
};

export const ValidationResultModal = (props: Props) => {
  const { show, onHide, validationResult, currentSchema } = props;

  const { namespace, projectName, tag } = useProjectPage();

  const updateForm = useForm<FormProps>({
    defaultValues: {
      schema: props.currentSchema,
    },
  });

  const { isPending: isSubmitting, submit } = useEditProjectMetaMutation(namespace, projectName, tag);
  const newSchema = updateForm.watch('schema');

  const handleSubmit = () => {
    if (newSchema === '') {
      submit({
        newSchema: undefined,
      });
    } else {
      submit({
        newSchema: newSchema,
      });
    }
  };

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
          {currentSchema ? (
            <>
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
            </>
          ) : (
            <span className="d-flex align-items-center gap-1">
              Select a Schema
            </span>
          )}
        </h1>
      </Modal.Header>
      <Modal.Body>
        {currentSchema ? (
          <>
          {validationResult?.valid ? (
            <p>Your PEP is valid against the schema.</p>
          ) : (
            <Fragment>
              <p>You PEP is invalid against the schema.</p>
              <p>Validation result:</p>
              <pre>
                <code>{JSON.stringify(validationResult, null, 2)}</code>
              </pre>
            </Fragment>
          )}
          </>
          ) : ( null
        )}
          
        <form className="mb-1">
          {currentSchema ? (
            <label className="mt-1 fw-bold">Change schemas here:</label>
          ) : (
            <label className="fw-bold">Add a schema here:</label>
          )}
          <div className="d-flex align-items-center w-100 gap-1">
            <Controller
              control={updateForm.control}
              name="schema"
              render={({ field }) => (
                <SchemaDropdown showDownload={false} value={field.value} onChange={field.onChange} />
              )}
            />

            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={isSubmitting || !updateForm.formState.isDirty}
              type="button"
            >
              <span className="d-flex align-items-center gap-1">
                {isSubmitting && (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                )}
                Update
              </span>
            </button>
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex align-items-center justify-content-between w-100">
          { currentSchema? 
            <div className="d-flex align-items-center">
              <a href={`/schemas/${props.currentSchema}`}>
                <button className="btn btn-sm btn-outline-dark">
                  <span className="d-flex align-items-center gap-1">
                    <i className="bi bi-arrow-left"></i>
                    Go to {props.currentSchema}
                  </span>
                </button>
              </a>
            </div>
            : null
          }
          <button className="btn btn-dark" onClick={onHide}>
            Close
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
