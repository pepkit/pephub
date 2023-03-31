import { FC, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { deleteProject } from '../../api/project';
import { useSession } from '../../hooks/useSession';

interface Props {
  show: boolean;
  onHide: () => void;
  namespace: string;
  project: string;
  tag?: string;
  redirect?: string;
}

export const DeletePEPModal: FC<Props> = ({ show, onHide, namespace, project, tag, redirect }) => {
  const { jwt } = useSession();
  const navigate = useNavigate();

  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    setDeleting(true);
    deleteProject(namespace, project, tag, jwt || '')
      .then((res) => {
        if (res.status == 202) {
          onHide();
          toast.success(`Successfully deleted ${namespace}/${project}:${tag}`);
        } else {
          toast.error(`Failed to delete ${namespace}/${project}:${tag}. Please try again later.`);
        }
      })
      .catch((err) => {
        toast.error(err.message);
      })
      .finally(() => {
        if (redirect) {
          navigate(redirect);
        }
        setDeleting(false);
      });
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
        <button
          onClick={() => handleDelete()}
          disabled={confirmText !== `${namespace}/${project}:${tag}` || deleting}
          type="button"
          className="btn btn-danger"
        >
          {deleting ? 'Deleting...' : 'Yes, delete'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
