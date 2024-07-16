import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { m } from 'framer-motion';
import { Fragment, useState } from 'react';
import { Modal } from 'react-bootstrap';
import toast from 'react-hot-toast';

import { deleteAllPepsFromNamespace } from '../../api/namespace';
import { useSession } from '../../contexts/session-context';
import { extractErrorMessage } from '../../utils/etc';

interface Props {
  show: boolean;
  onHide: () => void;
}

export const DeleteAllPepsModal = (props: Props) => {
  const { user, jwt } = useSession();
  const { show, onHide } = props;
  const queryClient = useQueryClient();

  const [confirmText, setConfirmText] = useState('');

  const namespace = user?.login || 'NOUSER';

  const mutation = useMutation({
    mutationFn: () => {
      return deleteAllPepsFromNamespace(namespace, jwt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [user?.login],
      });
      // just reload the whole thing
      window.location.reload();
    },
    onError: (err: AxiosError) => {
      const errorMessage = extractErrorMessage(err);
      toast.error(`${errorMessage}`, {
        duration: 5000,
      });
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
        <h1 className="modal-title fs-5">Delete all PEPs?</h1>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to delete all PEPs? This action cannot be undone.</p>
        <label className="mb-3">
          Please type <span className="fw-bold">{namespace}</span> to confirm:
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          id="delete-confirm-input"
          type="text"
          className="form-control"
          placeholder={`${namespace}`}
        />
      </Modal.Body>
      <Modal.Footer>
        <button
          className="btn btn-outline-dark"
          onClick={() => {
            setConfirmText('');
            onHide();
          }}
        >
          Nevermind
        </button>
        <button
          onClick={() => {
            mutation.mutate();
          }}
          disabled={confirmText !== `${namespace}`}
          type="button"
          className="btn btn-danger"
        >
          {mutation.isPending ? (
            <Fragment>
              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Clearing...
            </Fragment>
          ) : (
            <Fragment>
              <i className="bi bi-trash me-2"></i>
              Clear all PEPs
            </Fragment>
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
