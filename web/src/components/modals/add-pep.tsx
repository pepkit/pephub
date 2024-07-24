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
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Submit a new resource</h1>
      </Modal.Header>
      <Modal.Body>
        <Tabs defaultActiveKey="blank" id="uncontrolled-tab">
          <Tab
            eventKey="blank"
            title={
              <span>
                <i className="bi bi-pencil me-1"></i>
                Blank PEP
              </span>
            }
          >
            <div className="border border-top-0">
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
            <div className="border border-top-0">
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
            <div className="border border-top-0">
              <PopForm defaultNamespace={defaultNamespace} onHide={onHide} />
            </div>
          </Tab>
          <Tab
            eventKey="new-schema"
            title={
              <span>
                <i className="bi bi-filetype-yml me-1"></i>
                New schema
              </span>
            }
          >
            <div className="border border-top-0 p-2">
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
                Upload schema
              </span>
            }
          >
            <div className="border border-top-0 p-2">
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
      </Modal.Body>
    </Modal>
  );
};
