import { FC } from 'react';
import { Modal } from 'react-bootstrap';

import { useEditProjectMetaMutation } from '../../hooks/mutations/useEditProjectMetaMutation';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';

interface Props {
  show: boolean;
  onHide: () => void;
  namespace: string;
  project: string;
  tag?: string;
}

export const PopMoreInfoModal: FC<Props> = ({ show, onHide, namespace, project, tag }) => {
  const { data: projectInfo, isLoading } = useProjectAnnotation(namespace, project, tag || 'default');

  const mutation = useEditProjectMetaMutation(
    namespace,
    project,
    tag || 'default',
    () => {
      onHide();
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
      }}
    >
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">{isLoading ? 'Loading' : `${namespace}/${project}:${tag || 'default'}`}</h1>
      </Modal.Header>
      <Modal.Body>{JSON.stringify(projectInfo, null, 2)}</Modal.Body>
      <Modal.Footer>
        <button onClick={() => mutation.mutate()} type="button" className="btn btn-success">
          {mutation.isPending ? 'Saving' : 'Save'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
