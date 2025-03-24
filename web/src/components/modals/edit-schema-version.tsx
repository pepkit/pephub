import { Modal, Tab, Tabs } from 'react-bootstrap';

import { EditSchemaVersionForm } from '../forms/edit-schema-version-form';

interface Props {
  show: boolean;
  onHide: () => void;
  namespace: string;
  name: string;
  contributors: string;
  releaseNotes: string;
  refetchSchemaVersions: () => void;
}

export const EditSchemaVersionModal = (props: Props) => {
  const { show, onHide, namespace, name, contributors, releaseNotes, refetchSchemaVersions } = props;
  
  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Body>
        <div className='p-1 modal-pill'>
          <h1 className="fs-5 mb-1 fw-semibold d-inline">Edit Current Schema Version</h1>
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
            <EditSchemaVersionForm
              namespace={namespace}
              name={name}
              editorHeight="400px"
              contributors={contributors}
              releaseNotes={releaseNotes}
              refetchSchemaVersions={refetchSchemaVersions}
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
