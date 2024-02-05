import { FC } from 'react';
import { Modal } from 'react-bootstrap';

interface Props {
  show: boolean;
  onHide: () => void;
}

export const DownloadGeo: FC<Props> = ({ show, onHide }) => {
  return (
    <Modal
      centered
      animation={false}
      show={show}
      onHide={() => {
        onHide();
      }}
    >
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Download all GEO metadata</h1>
      </Modal.Header>
      <Modal.Body>
        <p>
          This will download all available PEPs that we have for the Gene Expresion Omnibus. The file is about 1.1G and
          will be downloaded as a single <code>tar</code> file.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <a href="https://cloud2.databio.org/pephub/2024-01-29-pephub-geo.tar">
          <button type="button" className="btn btn-dark">
            Yes, download
          </button>
        </a>
        <button type="button" className="btn btn-outline-dark" onClick={onHide}>
          Nevermind
        </button>
      </Modal.Footer>
    </Modal>
  );
};
