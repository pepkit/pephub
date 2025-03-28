import { FC } from 'react';
import { Modal } from 'react-bootstrap';

import { useSchemaVersionNumber } from '../../hooks/stores/useSchemaVersionNumber';

const API_HOST = import.meta.env.VITE_API_HOST || '';

interface Props {
  namespace: string;
  name: string;
  show: boolean;
  onHide: () => void;
}

export const SchemaAPIEndpointsModal: FC<Props> = ({ namespace, name, show, onHide }) => {
  const { schemaVersionNumber } = useSchemaVersionNumber();

  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">API Endpoints</h1>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-2">
          <span className="badge bg-primary me-1">GET</span>
          <span className="fw-bold me-1">Schema Metadata:</span>
          <a href={`${API_HOST}/api/v1/schemas/${namespace}/${name}`}>
            <code>
              /api/v1/schemas/{namespace}/{name}
            </code>
          </a>
        </p>
        <p className="mb-2">
          <span className="badge bg-primary me-1">GET</span>
          <span className="fw-bold me-1">Schema Versions:</span>
          <a href={`${API_HOST}/api/v1/schemas/${namespace}/${name}/versions`}>
            <code>
              /api/v1/schemas/{namespace}/{name}/versions
            </code>
          </a>
        </p>
        <p className="mb-2">
          <span className="badge bg-primary me-1">GET</span>
          <span className="fw-bold me-1">Current Version JSON:</span>
          <a href={`${API_HOST}/api/v1/schemas/${namespace}/${name}/versions/${schemaVersionNumber}?format=json`}>
            <code>
              /api/v1/schemas/{namespace}/{name}/versions/{schemaVersionNumber}?format=json
            </code>
          </a>
        </p>
        <p className="mb-2">
          <span className="badge bg-primary me-1">GET</span>
          <span className="fw-bold me-1">Current Version YAML:</span>
          <a href={`${API_HOST}/api/v1/schemas/${namespace}/${name}/versions/${schemaVersionNumber}?format=yaml`}>
            <code>
              /api/v1/schemas/{namespace}/{name}/versions/{schemaVersionNumber}?format=yaml
            </code>
          </a>
        </p>
      </Modal.Body>
    </Modal>
  );
};
