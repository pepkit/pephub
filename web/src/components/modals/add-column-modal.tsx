import { FC, SetStateAction, useState } from 'react';
import { Modal } from 'react-bootstrap';

interface Props {
  show: boolean;
  onHide: () => void;
  onAdd: (c: string) => void;
}

export const AddColumnModal: FC<Props> = ({ show, onHide, onAdd }) => {
  const [newColumnName, setNewColumnName] = useState<string>('');

  const handleSubmit = () => {
    // add a new column to the right
    onAdd(newColumnName);
  };

  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Add New Column</h1>
      </Modal.Header>
      <Modal.Body>
        <label className="form-label">New Column Name:</label>
        <input
          placeholder="Cell line"
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          type="text"
          className="form-control"
        />
        <div className="mt-2">
          <button
            onClick={() => {
              handleSubmit();
              onHide();
            }}
            disabled={newColumnName.length === 0}
            className="btn btn-success "
          >
            Add
          </button>
          <button
            onClick={() => {
              onHide();
              setNewColumnName('');
            }}
            className="btn btn-outline-dark ms-1"
          >
            Cancel
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
