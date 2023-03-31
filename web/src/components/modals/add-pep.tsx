import { FC } from 'react';
import { Modal, Tab, Tabs } from 'react-bootstrap';
import { ProjectUploadForm } from '../forms/project-upload-form';
import { BlankProjectForm } from '../forms/blank-project-form';

interface Props {
  show: boolean;
  onHide: () => void;
}

export const AddPEPModal: FC<Props> = ({ show, onHide }) => {
  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Submit a new PEP</h1>
      </Modal.Header>
      <Modal.Body>
        <Tabs defaultActiveKey="blank" id="uncontrolled-tab">
          <Tab
            eventKey="blank"
            title={
              <span>
                <i className="bi bi-pencil me-1"></i>
                Blank
              </span>
            }
          >
            <div className="border border-top-0">
              <BlankProjectForm onHide={onHide} />
            </div>
          </Tab>
          <Tab
            eventKey="from-file"
            title={
              <span>
                <i className="bi bi-cloud-upload me-1"></i>
                Upload
              </span>
            }
          >
            <div className="border border-top-0">
              <ProjectUploadForm />
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
};
