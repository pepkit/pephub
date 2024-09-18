import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import { useDeleteSchemaMutation } from '../../hooks/mutations/useDeleteSchemaMutation';

type Props = {
  show: boolean;
  onHide: () => void;
  namespace: string;
  name: string;
  redirect?: string;
};

export const DeleteSchemaModal = (props: Props) => {
  const { show, onHide, namespace, name, redirect } = props;
  const navigate = useNavigate();

  const { delete: deleteSchema, isPending: isDeleting } = useDeleteSchemaMutation();
  const [confirmText, setConfirmText] = useState('');

  const onSuccess = () => {
    setConfirmText('');
  };

  return (
    <Modal
      centered
      animation={false}
      show={show}
      onHide={() => {
        onHide();
        setConfirmText('');
      }}
    >
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Delete Schema?</h1>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to delete this schema? This action cannot be undone.</p>
        <label className="mb-3">
          Please type{' '}
          <span className="fw-bold">
            {namespace}/{name}
          </span>{' '}
          to confirm:
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          id="delete-confirm-input"
          type="text"
          className="form-control"
          placeholder={`${namespace}/${name}`}
        />
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={() =>
            deleteSchema(
              {
                namespace,
                name,
              },
              {
                onSuccess: () => {
                  onSuccess();
                  onHide();
                  if (redirect) {
                    navigate(redirect);
                  }
                },
              },
            )
          }
          disabled={confirmText !== `${namespace}/${name}` || isDeleting}
          type="button"
          className="btn btn-danger"
        >
          {isDeleting ? 'Deleting...' : 'Yes, delete'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
