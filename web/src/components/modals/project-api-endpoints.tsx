import { FC } from 'react';
import { Modal } from 'react-bootstrap';

interface Props {
  namespace: string;
  project: string;
  tag: string;
  show: boolean;
  onHide: () => void;
}

export const ProjectAPIEndpointsModal: FC<Props> = ({ namespace, project, tag, show, onHide }) => {
  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">API Endpoints</h1>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-2">
          <span className="badge bg-primary me-1">GET</span>
          <span className="fw-bold me-1">Project:</span>
          <a href={`/api/v1/projects/${namespace}/${project}?tag=${tag}`}>
            <code>
              /api/v1/projects/{namespace}/{project}?tag={tag}
            </code>
          </a>
        </p>
        <p className="mb-2">
          <span className="badge bg-primary me-1">GET</span>
          <span className="fw-bold me-1">Samples:</span>
          <a href={`/api/v1/projects/${namespace}/${project}/samples?tag=${tag}`}>
            <code>
              /api/v1/projects/{namespace}/{project}/samples?tag={tag}
            </code>
          </a>
        </p>
        <p className="mb-2 sample-endpoint">
          <span className="badge bg-primary me-1">GET</span>
          <span className="fw-bold me-1">Specific Sample:</span>
          <code>
            <a className="m-0" id="sample-name-link">
              /api/v1/projects/{namespace}/{project}/samples/{' {sample_name} '}
            </a>
          </code>
        </p>
        <p className="mb-2">
          <span className="badge bg-primary me-1">GET</span>
          <span className="fw-bold me-1">Subsamples:</span>
          <a href={`/api/v1/projects/${namespace}/${project}/subsamples?tag=${tag}`}>
            <code>
              /api/v1/projects/{namespace}/{project}/subsamples?tag={tag}
            </code>
          </a>
        </p>
      </Modal.Body>
    </Modal>
  );
};
