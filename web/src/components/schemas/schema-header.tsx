import { Fragment, useState } from 'react';
import { Breadcrumb, Dropdown } from 'react-bootstrap';
import { useParams } from 'react-router-dom';

import { useSession } from '../../contexts/session-context';
import { copyToClipboard } from '../../utils/etc';

import { DeleteSchemaModal } from '../modals/delete-schema';
import { SchemaAPIEndpointsModal } from '../modals/schema-api-endpoints';

import { useSchemaVersionModalStore } from '../../hooks/stores/useSchemaVersionModalStore'
import { useSchemaEditModalStore } from '../../hooks/stores/useSchemaEditModalStore'

const API_HOST = import.meta.env.VITE_API_HOST || '';

type Props = {
  isDirty: boolean;
  handleDiscard: () => void;
};

export const SchemaHeader = (props: Props) => {
  const { isDirty, handleDiscard } = props;
  const { user } = useSession();
  const { namespace, schema } = useParams();

  const [copied, setCopied] = useState(false);
  const [showSchemaDeleteModal, setShowSchemaDeleteModal] = useState(false);
  const [showSchemaAPIModal, setShowSchemaAPIModal] = useState(false);

  const { setShowSchemaVersionModal } = useSchemaVersionModalStore();
  const { setShowSchemaEditModal } = useSchemaEditModalStore();

  return (
    <div className="p-2 w-100">
      <div className="d-flex align-items-center justify-content-between w-100">
        <Breadcrumb className="fw-bold pt-2">
          <Breadcrumb.Item href="/browse?view=schemas">schemas</Breadcrumb.Item>
          <Breadcrumb.Item href={`/schemas/${namespace}`}>{namespace}</Breadcrumb.Item>
          <Breadcrumb.Item active>{schema}</Breadcrumb.Item>
        </Breadcrumb>
        <div className="d-flex align-items-center gap-1">

          <div className="border border-dark shadow-sm rounded-1 ps-2 d-flex align-items-center">
            <span className="text-sm fw-bold">
              {namespace}/{schema}
            </span>
            <button
              className="btn btn-sm btn-link-dark shadow-none ms-1 pe-2 border-0"
              onClick={() => {
                copyToClipboard(`${namespace}/${schema}`);
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 1000);
              }}
            >
              {copied ? <i className="bi bi-check"></i> : <i className="bi bi-clipboard" />}
            </button>
          </div>

          <Dropdown>
            <Dropdown.Toggle size="sm" variant="dark">
              <i className="bi bi-gear-fill me-1"></i>
              More
            </Dropdown.Toggle>
            <Dropdown.Menu className="border border-light-subtle shadow">
              <Dropdown.Item as="a">
                <a
                  target="_blank"
                  href={`${API_HOST}/api/v1/schemas/${namespace}/${schema}/file`}
                  className="text-decoration-none text-reset"
                >
                  <i className="bi bi-file-earmark-zip me-1"></i>
                  Download
                </a>
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setShowSchemaAPIModal(true)}>
                <i className="bi bi-hdd-rack me-1"></i>
                API
              </Dropdown.Item>
              {user && (user.login === namespace || user.orgs.includes(namespace || 'NONE')) && (
                <>
                  <Dropdown.Item onClick={() => setShowSchemaEditModal(true)}>
                    <i className="me-1 bi bi-pencil-square"></i>
                    Edit
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setShowSchemaDeleteModal(true)}>
                  <i className="me-1 bi bi-trash3"></i>
                  Delete
                </Dropdown.Item>
                </>
                
              )}
            </Dropdown.Menu>
          </Dropdown>

        </div>
      </div>


      <DeleteSchemaModal
        namespace={namespace!}
        name={schema!}
        show={showSchemaDeleteModal}
        onHide={() => setShowSchemaDeleteModal(false)}
        redirect={`/${namespace}?view=schemas`}
      />
      <SchemaAPIEndpointsModal
        namespace={namespace!}
        name={schema!}
        show={showSchemaAPIModal}
        onHide={() => setShowSchemaAPIModal(false)}
      />
    </div>

  );
};
