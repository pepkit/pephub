import { FC, useState } from 'react';
import { Modal } from 'react-bootstrap';

import { useEditProjectMetaMutation } from '../../hooks/mutations/useEditProjectMetaMutation';

interface Props {
  show: boolean;
  onHide: () => void;
  namespace: string;
  project: string;
  tag?: string;
}

export const ConvertToPEPModal: FC<Props> = ({ show, onHide, namespace, project, tag }) => {
  const [confirmText, setConfirmText] = useState('');

  const onSuccess = () => {
    setConfirmText('');
  };

  const mutation = useEditProjectMetaMutation(
    namespace,
    project,
    tag || 'default',
    () => {
      onHide();
      onSuccess();
    },
    () => {},
    {
      isPop: false,
    },
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
        <h1 className="modal-title fs-5">Delete PEP?</h1>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to convert this to a PEP?</p>
        <label className="mb-3">
          Please type{' '}
          <span className="fw-bold">
            {namespace}/{project}:{tag}
          </span>{' '}
          to confirm:
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          id="delete-confirm-input"
          type="text"
          className="form-control"
          placeholder={`${namespace}/${project}:${tag}`}
        />
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={() => mutation.mutate()}
          disabled={confirmText !== `${namespace}/${project}:${tag}` || mutation.isPending}
          type="button"
          className="btn btn-success"
        >
          {mutation.isPending ? 'Converting...' : 'Yes, convert'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
