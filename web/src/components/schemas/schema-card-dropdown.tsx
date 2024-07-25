import { Fragment, useState } from 'react';
import { Button, ButtonGroup, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import { Schema } from '../../api/schemas';
import { useSession } from '../../contexts/session-context';
import { copyToClipboard } from '../../utils/etc';
import { DeleteSchemaModal } from '../modals/delete-schema';

type Props = {
  schema: Schema;
};

export const SchemaCardDropdown = (props: Props) => {
  const navigate = useNavigate();

  const { schema } = props;
  const { user } = useSession();

  const [copied, setCopied] = useState(false);
  const [showSchemaDeleteModal, setShowSchemaDeleteModal] = useState(false);

  return (
    <Dropdown as={ButtonGroup}>
      <Button onClick={() => navigate(`/schemas/${schema.namespace}/${schema.name}`)} variant="outline-dark" size="sm">
        View
      </Button>
      <Dropdown.Toggle split variant="outline-dark" id="dropdown-split-basic" />
      <Dropdown.Menu>
        <Dropdown.Item href={`/schemas/${schema.namespace}/${schema.name}`}>
          <i className="bi bi-eye me-1"></i>
          View
        </Dropdown.Item>
        <Dropdown.Item
          onClick={(e) => {
            e.preventDefault();
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 1000);
            copyToClipboard(`${schema.namespace}/${schema.name}`);
          }}
        >
          <i className="bi bi-copy me-1"></i>
          {copied ? 'Copied!' : 'Copy'}
        </Dropdown.Item>
        {user && (user.orgs.includes(schema.namespace) || user.login === schema.namespace) && (
          <Fragment>
            <Dropdown.Divider />
            <Dropdown.Item className="text-danger" onClick={() => setShowSchemaDeleteModal(true)}>
              <i className="bi bi-trash me-1"></i>
              Delete
            </Dropdown.Item>
          </Fragment>
        )}
      </Dropdown.Menu>
      <DeleteSchemaModal
        show={showSchemaDeleteModal}
        onHide={() => setShowSchemaDeleteModal(false)}
        namespace={schema.namespace}
        name={schema.name}
      />
    </Dropdown>
  );
};
