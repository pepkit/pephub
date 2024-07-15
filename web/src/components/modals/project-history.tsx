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
import { ProjectHistoryTable } from '../history/history-table';

type Props = {
  show: boolean;
  namespace: string;
  project: string;
  tag?: string;
  onHide: () => void;
};

export const ProjectHistoryModal = (props: Props) => {
  const { show, namespace, project, tag, onHide } = props;

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
        <ProjectHistoryTable hideModal={onHide} />
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
