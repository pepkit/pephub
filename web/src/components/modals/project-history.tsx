import { Fragment, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { set } from 'react-hook-form';

import { useProjectPage } from '../../contexts/project-page-context';
import { useSession } from '../../contexts/session-context';
import { useDeleteProjectHistory } from '../../hooks/mutations/useDeleteProjectHistory';
import { useProjectAllHistory } from '../../hooks/queries/useProjectAllHistory';
import { useCurrentHistoryId } from '../../hooks/stores/useCurrentHistoryId';
import { dateStringToDateTime } from '../../utils/dates';
import { downloadHistoryZip } from '../../utils/project';

type Props = {
  show: boolean;
  namespace: string;
  project: string;
  tag?: string;
  onHide: () => void;
};

export const ProjectHistoryModal = (props: Props) => {
  const { show, namespace, project, tag, onHide } = props;

  const { setCurrentHistoryId } = useCurrentHistoryId();
  const { jwt } = useSession();

  const projectAllHistoryQuery = useProjectAllHistory(namespace, project, tag || 'default');

  const historyUpdates = projectAllHistoryQuery.data?.history || [];

  const deleteProjectHistoryMutation = useDeleteProjectHistory(namespace, project, tag || 'default');

  const [isConfirming, setIsConfirming] = useState(false);
  const [historyIdToDelete, setHistoryIdToDelete] = useState<number | null>(null);

  return (
    <Modal
      centered
      animation={false}
      show={show}
      onHide={() => {
        onHide();
      }}
      size="xl"
    >
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Project history</h1>
      </Modal.Header>
      <Modal.Body>
        <table className="table table-sm table-hover">
          <thead>
            <tr>
              <th>Change ID</th>
              <th>Timestamp</th>
              <th>Author</th>
              <th
                style={{
                  width: '400px',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {historyUpdates.length > 0 ? (
              historyUpdates.map((history) => (
                <tr key={history.change_id}>
                  <td>
                    <span className="h-100 d-flex flex-row align-items-center">{history.change_id}</span>
                  </td>
                  <td>
                    <span className="h-100 d-flex flex-row align-items-center">
                      {dateStringToDateTime(history.change_date)}
                    </span>
                  </td>
                  <td>
                    <span className="h-100 d-flex flex-row align-items-center">{history.user}</span>
                  </td>
                  <td>
                    <span className="d-flex flex-row align-items-center gap-1">
                      <button
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => {
                          downloadHistoryZip(namespace, project, tag || 'default', history.change_id, jwt);
                        }}
                      >
                        <i className="bi bi-download"></i>
                      </button>
                      <button
                        className="btn btn-outline-dark btn-sm"
                        onClick={() => {
                          setCurrentHistoryId(history.change_id);
                          onHide();
                        }}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      {isConfirming && history.change_id === historyIdToDelete ? (
                        <Fragment>
                          <span className="d-flex flex-row align-items-center gap-2">
                            <span className="fst-italic">Are you sure?</span>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                setHistoryIdToDelete(null);
                                setIsConfirming(false);
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              disabled={deleteProjectHistoryMutation.isPending}
                              onClick={() => {
                                deleteProjectHistoryMutation.mutate(history.change_id, {
                                  onSuccess: () => {
                                    setHistoryIdToDelete(null);
                                    setIsConfirming(false);
                                  },
                                });
                              }}
                            >
                              Yes, delete
                            </button>
                          </span>
                        </Fragment>
                      ) : (
                        <button
                          disabled={deleteProjectHistoryMutation.isPending && history.change_id === historyIdToDelete}
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => {
                            setHistoryIdToDelete(history.change_id);
                            setIsConfirming(true);
                          }}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>
                  <div className="d-flex flex-column align-items-center justify-content-center">
                    <p className="mt-3 text-muted fst-italic">No project history</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={() => {
            onHide();
          }}
          //   disabled={confirmText !== `${namespace}/${project}:${tag}` || mutation.isPending}
          type="button"
          className="btn btn-dark"
        >
          {/* {mutation.isPending ? 'Deleting...' : 'Yes, delete'} */}
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};
