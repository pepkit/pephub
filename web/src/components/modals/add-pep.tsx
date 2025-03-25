import { Modal, Tab, Tabs } from 'react-bootstrap';

import { BlankProjectForm } from '../forms/blank-project-form';
import { CreateSchemaForm } from '../forms/create-schema-form';
import { PopForm } from '../forms/pop-form';
import { ProjectUploadForm } from '../forms/project-upload-form';
import { SchemaUploadForm } from '../forms/upload-schema-form';

interface Props {
  show: boolean;
  defaultNamespace?: string;
  onHide: () => void;
}

export const AddPEPModal = (props: Props) => {
  const { show, onHide, defaultNamespace } = props;
  return (
    <Modal size="lg" centered animation={false} backdrop="static" show={show} onHide={onHide}>
      <Modal.Body>
        <div className='p-1 modal-pill'>
          <h1 className="fs-5 mb-1 fw-semibold d-inline">Submit a new resource</h1>
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
            justify defaultActiveKey="blank" 
            id="uncontrolled-tab"
            className='border border-2 border-light-subtle rounded rounded-3 text-sm bg-body-secondary mt-3' 
           >
            <Tab
              eventKey="blank"
              title={
                <span>
                  <i className="bi bi-pencil me-1"></i>
                  Blank PEP
                </span>
              }
            >
              <div className="">
                <BlankProjectForm defaultNamespace={defaultNamespace} onHide={onHide} />
              </div>
            </Tab>
            <Tab
              eventKey="from-file"
              title={
                <span>
                  <i className="bi bi-cloud-upload me-1"></i>
                  Upload PEP
                </span>
              }
            >
              <div className="">
                <ProjectUploadForm defaultNamespace={defaultNamespace} onHide={onHide} />
              </div>
            </Tab>
            <Tab
              eventKey="pop"
              title={
                <span>
                  <i className="bi bi-collection me-1"></i>
                  POP
                </span>
              }
            >
              <div className="">
                <PopForm defaultNamespace={defaultNamespace} onHide={onHide} />
              </div>
            </Tab>
            <Tab
              eventKey="new-schema"
              title={
                <span>
                  <i className="bi bi-filetype-json me-1"></i>
                  New Schema
                </span>
              }
            >
              <div className="">
                <CreateSchemaForm
                  defaultNamespace={defaultNamespace}
                  editorHeight="400px"
                  onCancel={onHide}
                  onSubmit={() => {
                    onHide();
                  }}
                />
              </div>
            </Tab>
            <Tab
              eventKey="upload-schema"
              title={
                <span>
                  <i className="bi bi-cloud-upload me-1"></i>
                  Upload Schema
                </span>
              }
            >
              <div className="">
                <SchemaUploadForm
                  defaultNamespace={defaultNamespace}
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
