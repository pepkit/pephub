import { Modal, Tab, Tabs } from 'react-bootstrap';

import { CreateSchemaVersionForm } from '../forms/create-schema-version-form';
import { UploadSchemaVersionForm } from '../forms/upload-schema-version-form';

interface Props {
  show: boolean;
  onHide: () => void;
  namespace: string;
  name: string;
  tags: Record<string, string>;
  schemaJson: object;
  contributors: string;
  refetchSchemaVersions: () => void;
}

export const CreateSchemaVersionModal = (props: Props) => {
  const { show, onHide, namespace, name, tags, schemaJson, contributors, refetchSchemaVersions } = props;
  
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
          {/* <div className="border-bottom" style={{ margin: '0 -1.25em' }}></div> */}
          <Tabs
            variant="pills" 
            justify defaultActiveKey="editor" 
            id="uncontrolled-tab"
            className='border border-2 border-light-subtle rounded rounded-3 text-sm bg-body-secondary mt-3' 
            >
            <Tab
              eventKey="editor"
              title={
                <span>
                  <i className="bi bi-pencil me-1"></i>
                  From Editor
                </span>
              }
            >
              <div className="">
                <CreateSchemaVersionForm
                  namespace={namespace}
                  name={name}
                  editorHeight="400px"
                  tags={tags}
                  schemaJson={schemaJson}
                  contributors={contributors}
                  refetchSchemaVersions={refetchSchemaVersions}
                  onCancel={onHide}
                  onSubmit={() => {
                    onHide();
                  }}
                />
              </div>
            </Tab>
            <Tab
              eventKey="upload"
              title={
                <span>
                  <i className="bi bi-cloud-upload me-1"></i>
                  Upload
                </span>
              }
            >
              <div className="">
                <UploadSchemaVersionForm
                  namespace={namespace}
                  name={name}
                  tags={tags}
                  contributors={contributors}
                  refetchSchemaVersions={refetchSchemaVersions}
                  onCancel={onHide}
                  onSubmit={() => {
                    onHide();
                  }}
                />
              </div>
            </Tab>
          </Tabs>
        </div>
      </Modal.Body>
    </Modal>
  );
};
