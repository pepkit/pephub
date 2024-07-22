import { Modal } from 'react-bootstrap';

import { CreateSchemaForm } from '../forms/create-schema-form';

type Props = {
  show: boolean;
  onHide: () => void;
};

export const CreateSchemaModal = (props: Props) => {
  const { show, onHide } = props;
  return (
    <Modal
      size="xl"
      centered
      animation={false}
      show={show}
      onHide={() => {
        onHide();
      }}
    >
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Create a new schema</h1>
      </Modal.Header>
      <Modal.Body>
        <CreateSchemaForm
          onCancel={() => {
            onHide();
          }}
          onSubmit={() => {
            onHide();
          }}
        />
      </Modal.Body>
    </Modal>
  );
};
