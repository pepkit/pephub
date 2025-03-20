import { Modal, Tab, Tabs } from 'react-bootstrap';

import { VersionSchemaForm } from '../forms/version-schema-form';

interface Props {
  show: boolean;
  onHide: () => void;
  namespace: string;
  name: string;
  tags: Record<string, string>;
  schemaJson: object;
  contributors: string;
}

export const VersionSchemaModal = (props: Props) => {
  const { show, onHide, namespace, name, tags, schemaJson, contributors } = props;
  
  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Body>
        <div className='p-1 modal-pill'>
          <h1 className="fs-5 mb-1 fw-semibold d-inline">New Schema Version</h1>
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
            <VersionSchemaForm
              namespace={namespace}
              name={name}
              editorHeight="400px"
              tags={tags}
              schemaJson={schemaJson}
              contributors={contributors}
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
