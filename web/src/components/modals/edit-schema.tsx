import { Modal, Tab, Tabs } from 'react-bootstrap';

import { EditSchemaForm } from '../forms/edit-schema-form';

interface Props {
  show: boolean;
  namespace: string;
  name: string;
  description: string;
  maintainers: string;
  lifecycleStage: string;
  isPrivate: boolean;
  onHide: () => void;
}

export const EditSchemaModal = (props: Props) => {
  const { show, onHide, namespace, name, description, maintainers, lifecycleStage, isPrivate } = props;
  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Body>
        <div className='p-1 modal-pill'>
          <h1 className="fs-5 mb-1 fw-semibold d-inline">Edit Schema Metadata</h1>
          <button
            className="btn btn-outline-dark px-1 py-0 m-0 float-end d-inline rounded-3 border-0 shadow-none"
            type="button" 
            onClick={() => {
              onHide();
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
          <p className='text-sm mt-1 mb-3'></p>
          <div className="border-bottom" style={{ margin: '0 -1.25em' }}></div>
          <div className="">
            <EditSchemaForm
              namespace={namespace}
              name={name}
              description={description}
              maintainers={maintainers}
              lifecycleStage={lifecycleStage}
              isPrivate={isPrivate}
              editorHeight="400px"
              onCancel={onHide}
              onSubmit={() => {
                onHide();
              }}
            />
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
