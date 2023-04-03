import { FC, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { deleteProject } from '../../api/project';
import { useSession } from '../../hooks/useSession';
import { useMutation } from '@tanstack/react-query';

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

  const queryClient = useQueryClient();

  const [confirmText, setConfirmText] = useState('');

  // function/object to handle deleting a project
  const mutation = useMutation({
    mutationFn: () => deleteProject(namespace, project, tag, jwt || ''),
    onSuccess: () => {
      toast.success('Project successfully deleted.');
      queryClient.invalidateQueries({
        queryKey: [namespace],
      });
      onHide();
      if (redirect) {
        navigate(redirect);
      }
    },
    onError: (err) => {
      toast.error(`There was an error deleting the project: ${err}`);
    },
  });

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
          onClick={() => mutation.mutate()}
          disabled={confirmText !== `${namespace}/${project}:${tag}` || mutation.isLoading}
          type="button"
          className="btn btn-danger"
        >
          {mutation.isLoading ? 'Deleting...' : 'Yes, delete'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
