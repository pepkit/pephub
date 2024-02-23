import { FC } from 'react';
import { FormCheck, Modal } from 'react-bootstrap';

import { useLocalStorage } from '../../hooks/useLocalStorage';

interface Props {
  show: boolean;
  onHide: () => void;
  namespace?: string;
}

export const LargeSampleTableModal: FC<Props> = ({ show, onHide, namespace }) => {
  const [_, setHideLargeSampleTableModal] = useLocalStorage('hideLargeSampleTableModal', 'false');
  return (
    <Modal
      centered
      animation={false}
      show={show}
      onHide={() => {
        onHide();
      }}
    >
      <Modal.Header closeButton className="bg-warning bg-opacity-25">
        <h1 className="modal-title fs-5">Very large sample table detected!</h1>
      </Modal.Header>
      <Modal.Body>
        <p>
          You've stumbled upon a very large sample table. Because of this, we've disabled viewing the entire table in
          the browser for performance reasons. You can still view slices of the sample table by leveraging PEP{' '}
          <a href="https://pephub-api.databio.org/api/v1/docs#/project/get_views_api_v1_projects__namespace___project__views_get">
            views
          </a>
          .
        </p>
        <p>
          Use the dropdown in the top right to select a view, or use the API directly to fetch slices of the sample
          table.
        </p>
        <form>
          <input
            type="checkbox"
            id="dont-show-again"
            className="form-check-input"
            onChange={(e) => {
              if (e.target.checked) {
                setHideLargeSampleTableModal('true');
              } else {
                setHideLargeSampleTableModal('false');
              }
            }}
          />
          <label htmlFor="dont-show-again" className="ms-1 form-check-label">
            Don't show this message again
          </label>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <button onClick={onHide} type="button" className="btn btn-dark">
          Dismiss
        </button>
      </Modal.Footer>
    </Modal>
  );
};
