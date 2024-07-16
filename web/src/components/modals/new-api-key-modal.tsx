import { useState } from 'react';
import { Modal } from 'react-bootstrap';

interface Props {
  show: boolean;
  onHide: () => void;
  newKey: string;
  setNewKey: (key: string) => void;
}

export const NewApiKeyModal = (props: Props) => {
  const { show, onHide, newKey, setNewKey } = props;

  const [copied, setCopied] = useState(false);

  return (
    <Modal
      centered
      size="lg"
      animation={false}
      show={show}
      onHide={() => {
        setNewKey('');
        onHide();
      }}
    >
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Success! Here is your new API key.</h1>
      </Modal.Header>
      <Modal.Body>
        <h5>About your new key:</h5>
        <p className="text-muted">
          This is your new API key. Please copy it now, as it will not be shown again. You can use this key to access
          the API from your scripts or other applications.
        </p>
        <div className="p-1 border border-dark rounded pb-4 shadow-sm">
          <pre className="text-wrap text-xs">
            <code>{newKey}</code>
          </pre>
        </div>
        <div
          className="d-flex align-items-center justify-content-end w-100"
          style={{
            transform: 'translateY(-125%)',
          }}
        >
          <button
            onClick={() => {
              navigator.clipboard.writeText(newKey);
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
              }, 2000);
            }}
            disabled={copied}
            type="button"
            className="btn btn-sm btn-dark me-2"
          >
            {copied ? (
              <span>
                <i className="bi bi-check me-2"></i>
                Copied!
              </span>
            ) : (
              <span>
                <i className="bi bi-clipboard me-2"></i>
                Copy to clipboard
              </span>
            )}
          </button>
        </div>
      </Modal.Body>
      {/* <Modal.Footer>
        <button
          onClick={() => {
            onHide();
            setNewKey('');
          }}
          type="button"
          className="btn btn-dark"
        >
          I copied it!
        </button>
      </Modal.Footer> */}
    </Modal>
  );
};
