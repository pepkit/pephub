import { Modal } from 'react-bootstrap';
import { ProjectMetaEditForm } from '../forms/edit-project-meta';
import { FC } from 'react';

interface Props {
  namespace: string;
  project: string;
  description: string;
  tag: string;
  isPrivate: boolean;
  show: boolean;
  onHide: () => void;
}

export const EditMetaMetadataModal: FC<Props> = ({ namespace, project, description, tag, isPrivate, show, onHide }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Metadata</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ProjectMetaEditForm
          namespace={namespace}
          name={project}
          description={description}
          tag={tag || 'default'}
          isPrivate={isPrivate || false}
        />
      </Modal.Body>
    </Modal>
  );
};
