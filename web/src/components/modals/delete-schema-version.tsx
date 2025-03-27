import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useQueryClient } from '@tanstack/react-query';

import { useDeleteSchemaVersionMutation } from '../../hooks/mutations/useDeleteSchemaVersionMutation';
import { useSchemaVersionNumber } from '../../hooks/stores/useSchemaVersionNumber';

type Props = {
  show: boolean;
  onHide: () => void;
  namespace: string;
  name: string;
  allVersions: string[];
  refetchSchemaVersions: () => void;
};

export const DeleteSchemaVersionModal = (props: Props) => {
  const { show, onHide, namespace, name, allVersions, refetchSchemaVersions } = props;

  const { delete: deleteSchemaVersion, isPending: isDeleting } = useDeleteSchemaVersionMutation();
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState('');

  const { schemaVersionNumber, setSchemaVersionNumber } = useSchemaVersionNumber();

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
        <h1 className="modal-title fs-5">Delete Schema Version?</h1>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to delete this schema version? This action cannot be undone.</p>
        <label className="mb-3">
          Please type{' '}
          <span className="fw-bold">
            {namespace}/{name}:{schemaVersionNumber}
          </span>{' '}
          to confirm:
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          id="delete-confirm-input"
          type="text"
          className="form-control"
          placeholder={`${namespace}/${name}:${schemaVersionNumber}`}
        />
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={() => {
            if (allVersions.length > 1) {
              let previousVersionNumber =  allVersions.filter(version => version !== schemaVersionNumber).sort().reverse()[0];
              deleteSchemaVersion(
                {
                  namespace,
                  name,
                  version: schemaVersionNumber || ''
                },
                {
                  onSuccess: () => {
                    onSuccess();
                    onHide();
                    refetchSchemaVersions();
                    setSchemaVersionNumber(previousVersionNumber);
                  },
                },
              );
            }
          }}
          disabled={confirmText !== `${namespace}/${name}:${schemaVersionNumber}` || isDeleting}
          type="button"
          className="btn btn-danger"
        >
          {isDeleting ? 'Deleting...' : 'Yes, delete'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
