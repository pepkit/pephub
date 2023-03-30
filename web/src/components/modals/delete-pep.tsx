import { FC, useState } from 'react';
import { Modal } from 'react-bootstrap';

interface Props {
  show: boolean;
  onHide: () => void;
  namespace: string;
  project: string;
  tag?: string;
}

export const DeletePEPModal: FC<Props> = ({ show, onHide, namespace, project, tag }) => {
  const [confirmText, setConfirmText] = useState('');
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
        <p>Are you sure you want to delete this PEP? This action cannot be undone.</p>
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
        <button disabled={confirmText !== `${namespace}/${project}:${tag}`} type="button" className="btn btn-danger">
          Yes, delete
        </button>
      </Modal.Footer>
    </Modal>
  );
};
