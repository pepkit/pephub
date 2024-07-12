import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Axios, AxiosError } from 'axios';
import { Modal } from 'react-bootstrap';
import toast from 'react-hot-toast';

import { restoreProjectFromHistory } from '../../api/project';
import { useProjectPage } from '../../contexts/project-page-context';
import { useSession } from '../../contexts/session-context';
import { useCurrentHistoryId } from '../../hooks/stores/useCurrentHistoryId';
import { extractErrorMessage } from '../../utils/etc';

type Props = {
  show: boolean;
  onHide: () => void;
};

export const RestoreFromHistoryModal = (props: Props) => {
  const { show, onHide } = props;

  const queryClient = useQueryClient();

  const { jwt } = useSession();
  const { namespace, projectName, tag } = useProjectPage();

  const { currentHistoryId: historyId, setCurrentHistoryId } = useCurrentHistoryId();

  const restoreProject = useMutation({
    mutationFn: () => {
      if (historyId === null) {
        throw new Error('historyId is required');
      }
      return restoreProjectFromHistory(namespace, projectName, tag, jwt, historyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [namespace, projectName, tag],
      });
      setCurrentHistoryId(null);
      toast.success('Project restored successfully', { duration: 5000 });
    },
    onError: (err: AxiosError) => {
      const msg = extractErrorMessage(err);
      toast.error(msg, { duration: 5000 });
    },
  });

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
        <h1 className="modal-title fs-5">Restore project from history</h1>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-column">
          <p>
            Are you sure you want to restore the project from this history? This will overwrite the current project.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={() => {
            onHide();
          }}
          type="button"
          className="btn btn-outline-dark"
        >
          Nevermind
        </button>
        <button
          type="button"
          className="btn btn-warning"
          onClick={() => {
            restoreProject.mutate();
          }}
          disabled={restoreProject.isPending}
        >
          {restoreProject.isPending ? (
            <span>
              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Restoring...
            </span>
          ) : (
            'Yes, restore'
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
