import { FC } from 'react';
import { Modal } from 'react-bootstrap';

import { ProjectMetaEditForm } from '../forms/edit-project-meta';

interface Props {
  namespace: string;
  project: string;
  tag: string;
  show: boolean;
  onHide: () => void;
}

export const EditMetaMetadataModal: FC<Props> = ({ namespace, project, tag, show, onHide }) => {
  return (
    <Modal centered animation={false} show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Metadata</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ProjectMetaEditForm
          onSubmit={() => onHide()}
          namespace={namespace}
          name={project}
          tag={tag || 'default'}
          onCancel={() => onHide()}
        />
      </Modal.Body>
    </Modal>
  );
};
