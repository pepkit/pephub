import { FC } from 'react';
import { Modal } from 'react-bootstrap';

interface Props {
  namespace: string;
  show: boolean;
  onHide: () => void;
}

const API_BASE = import.meta.env.VITE_API_HOST || '';

export const NamespaceAPIEndpointsModal: FC<Props> = ({ namespace, show, onHide }) => (
  <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <h1 className="modal-title fs-5">API Endpoints</h1>
    </Modal.Header>
    <Modal.Body>
      <p className="mb-2">
        <span className="badge bg-primary me-1">GET</span>
        <span className="fw-bold">Namespace:</span>
        <code>
          <a href={`${API_BASE}/api/v1/namespaces/${namespace}/`}>/api/v1/namespaces/{namespace}</a>
        </code>
      </p>
      <p className="mb-2">
        <span className="badge bg-primary me-1">GET</span>
        <span className="fw-bold">Namespace:</span>
        <code>
          <a href={`${API_BASE}/api/v1/namespaces/${namespace}/projects/`}>/api/v1/namespaces/{namespace}/projects</a>
        </code>
      </p>
    </Modal.Body>
  </Modal>
);
