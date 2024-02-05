import { FC, useState } from 'react';
import { Modal } from 'react-bootstrap';

import { Sample } from '../../../types';
import { useSampleTableMutation } from '../../hooks/mutations/useSampleTableMutation';

interface Props {
  show: boolean;
  onHide: () => void;
  currentPeps: Sample[];
  namespaceToRemove: string;
  projectToRemove: string;
  tagToRemove?: string;
  namespaceToRemoveFrom: string;
  projectToRemoveFrom: string;
  tagToRemoveFrom?: string;
}

export const RemovePEPFromPOPModal: FC<Props> = ({
  show,
  onHide,
  currentPeps,
  namespaceToRemoveFrom,
  projectToRemoveFrom,
  tagToRemoveFrom,
  namespaceToRemove,
  projectToRemove,
  tagToRemove,
}) => {
  const [confirmText, setConfirmText] = useState('');

  const onSuccess = () => {
    setConfirmText('');
  };

  const sampleTableMutation = useSampleTableMutation(
    namespaceToRemoveFrom!,
    projectToRemoveFrom!,
    tagToRemoveFrom || 'default',
  );

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
        <h1 className="modal-title fs-5">Remove PEP from POP?</h1>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to remove this PEP? This action cannot be undone.</p>
        <label className="mb-3">
          Please type{' '}
          <span className="fw-bold">
            {namespaceToRemove}/{projectToRemove}:{tagToRemove}
          </span>{' '}
          to confirm:
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          id="delete-confirm-input"
          type="text"
          className="form-control"
          placeholder={`${namespaceToRemove}/${projectToRemove}:${tagToRemove}`}
        />
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={() => {
            sampleTableMutation.mutate(
              currentPeps.filter((pep) => pep.sample_name !== `${namespaceToRemove}/${projectToRemove}:${tagToRemove}`),
              {
                onSuccess: () => {
                  onSuccess();
                  onHide();
                },
              },
            );
          }}
          disabled={
            confirmText !== `${namespaceToRemove}/${projectToRemove}:${tagToRemove}` || sampleTableMutation.isPending
          }
          type="button"
          className="btn btn-danger"
        >
          {sampleTableMutation.isPending ? 'Removing...' : 'Yes, remove'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
