import { FC } from 'react';
import { Modal } from 'react-bootstrap';

const API_HOST = import.meta.env.VITE_API_HOST || '';

interface Props {
  namespace: string;
  name: string;
  show: boolean;
  onHide: () => void;
}

export const SchemaAPIEndpointsModal: FC<Props> = ({ namespace, name, show, onHide }) => {
  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">API Endpoints</h1>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-2">
          <span className="badge bg-primary me-1">GET</span>
          <span className="fw-bold me-1">Schema:</span>
          <a href={`${API_HOST}/api/v1/schemas/${namespace}/${name}`}>
            <code>
              /api/v1/schemas/{namespace}/{name}
            </code>
          </a>
        </p>
      </Modal.Body>
    </Modal>
  );
};
