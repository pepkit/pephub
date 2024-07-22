import { useState } from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import YAML from 'yaml';

import { useSession } from '../../contexts/session-context';
import { useSchema } from '../../hooks/queries/useSchema';
import { copyToClipboard } from '../../utils/etc';

export const SchemaHeader = () => {
  const { user } = useSession();
  const { namespace, schema } = useParams();

  const [copied, setCopied] = useState(false);

  const { data: schemaData } = useSchema(namespace, schema);
  const schemaObj = YAML.parse(schemaData?.schema || '');

  return (
    <div className="p-2 w-100">
      <div className="d-flex align-items-center justify-content-between w-100">
        <Breadcrumb className="fw-bold pt-2">
          <Breadcrumb.Item href="/schemas">schemas</Breadcrumb.Item>
          <Breadcrumb.Item>{namespace}</Breadcrumb.Item>
          <Breadcrumb.Item active>{schema}</Breadcrumb.Item>
        </Breadcrumb>
        <div className="d-flex align-items-center gap-2">
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
          {user && (user.login === namespace || user.orgs.includes(namespace || 'NONE')) && (
            <button className="btn btn-sm btn-danger">
              <i className="bi bi-trash"></i> Delete
            </button>
          )}
        </div>
      </div>
      <div className="text-muted">{schemaObj['description'] || 'No description.'}</div>
    </div>
  );
};
