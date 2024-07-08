import { useState } from 'react';
import { Modal } from 'react-bootstrap';

import { useProjectPage } from '../../contexts/project-page-context';

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
        <h1 className="modal-title fs-5">Project history</h1>
      </Modal.Header>
      <Modal.Body></Modal.Body>
      <Modal.Footer>
        <button
          //   onClick={() => mutation.mutate()}
          //   disabled={confirmText !== `${namespace}/${project}:${tag}` || mutation.isPending}
          type="button"
          className="btn btn-danger"
        >
          {/* {mutation.isPending ? 'Deleting...' : 'Yes, delete'} */}
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};
