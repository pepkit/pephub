import { useState } from 'react';
import { Modal } from 'react-bootstrap';

import { useProjectPage } from '../../contexts/project-page-context';
import { dateStringToDateTime } from '../../utils/dates';

type Props = {
  show: boolean;
  namespace: string;
  project: string;
  tag?: string;
  onHide: () => void;
};

export const ProjectHistoryModal = (props: Props) => {
  const { show, namespace, project, tag, onHide } = props;

  const { projectHistoryQuery } = useProjectPage();
  const historyUpdates = projectHistoryQuery.data?.history || [];

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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {historyUpdates.map((history) => (
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
                  <span className="d-flex flex-row align-items-center">
                    <button className="btn btn-outline-dark btn-sm me-1">View</button>
                  </span>
                </td>
              </tr>
            ))}
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
