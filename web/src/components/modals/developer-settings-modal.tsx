import { useState } from 'react';
import { Col, ListGroup, Modal, Row } from 'react-bootstrap';

import { ApiKeyView } from '../developer-settings/api-key-view';

type Props = {
  show: boolean;
  onHide: () => void;
};

type View = 'api-keys' | 'account' | 'settings';

export const DeveloperSettingsModal = (props: Props) => {
  const { show, onHide } = props;

  const [view, setView] = useState<View>('api-keys');

  return (
    <Modal size="xl" centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Developer Settings</h1>
      </Modal.Header>
      <Modal.Body className="bg-secondary bg-opacity-10">
        <Row>
          <Col className="border-end" md={3}>
            <ListGroup defaultActiveKey="#link1">
              <ListGroup.Item action onClick={() => setView('api-keys')}>
                <i className="bi bi-key me-1"></i>
                API Keys
              </ListGroup.Item>
              <ListGroup.Item action onClick={() => setView('account')}>
                <i className="bi bi-person me-1"></i>
                Account
              </ListGroup.Item>
              <ListGroup.Item action onClick={() => setView('settings')}>
                <i className="bi bi-gear me-1"></i>
                Settings
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col md={9}>
            <div className="border h-100 rounded bg-light">
              {view === 'api-keys' ? (
                <ApiKeyView />
              ) : view === 'account' ? (
                <div>
                  <h1>Account View</h1>
                </div>
              ) : view === 'settings' ? (
                <div>
                  <h1>Settings View</h1>
                </div>
              ) : null}
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};
