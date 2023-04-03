import { FC } from 'react';
import { Modal, OverlayTrigger, Tooltip, TooltipProps } from 'react-bootstrap';

const renderScoreThresholdTooltip = (props: TooltipProps) => {
  return (
    <Tooltip {...props}>
      The score threshold is used to filter out PEPs that are not relevant to your search. The higher the threshold, the
      more relevant the results will be.
    </Tooltip>
  );
};

interface Props {
  show: boolean;
  onHide: () => void;
  scoreThreshold: number;
  setScoreThreshold: (scoreThreshold: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  offset: number;
  setOffset: (offset: number) => void;
  onSearch: () => void;
}

export const SearchOptionsModal: FC<Props> = ({
  show,
  onHide,
  scoreThreshold,
  setScoreThreshold,
  limit,
  setLimit,
  offset,
  setOffset,
  onSearch,
}) => {
  const setToDefault = () => {
    setScoreThreshold(0.5);
    setLimit(10);
    setOffset(0);
  };

  return (
    <Modal centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Search Options</h1>
      </Modal.Header>
      <Modal.Body>
        <label htmlFor="score-threshold" className="form-label">
          Score threshold
          <OverlayTrigger placement="right" overlay={renderScoreThresholdTooltip}>
            <i className="bi bi-info-circle ms-1"></i>
          </OverlayTrigger>
        </label>
        <div className="d-flex flex-row align-items-center">
          <input
            onChange={(e) => setScoreThreshold(Number((parseFloat(e.target.value) / 100).toFixed(2)))}
            value={scoreThreshold * 100}
            type="range"
            className="form-range"
            id="score-threshold"
          ></input>
          <span className="ms-2 fw-bold mx-2">{scoreThreshold}</span>
        </div>
        <label htmlFor="limit" className="form-label">
          Limit
        </label>
        <select value={limit} onChange={(e) => setLimit(parseInt(e.target.value))} className="form-control form-select">
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <label htmlFor="offset" className="form-label mt-2">
          Offset
        </label>
        <input
          onChange={(e) => setOffset(parseInt(e.target.value))}
          value={offset}
          type="number"
          className="form-control"
          id="offset"
        ></input>
        <div className="mt-3">
          <button className="btn btn-outline-dark me-1" onClick={() => setToDefault()}>
            Reset
          </button>
          <button onClick={() => onSearch()} className="btn btn-success me-1">
            Search
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
