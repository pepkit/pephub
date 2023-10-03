import { OverlayTrigger, Tooltip } from 'react-bootstrap';

export const ValidationTooltip = () => (
  <OverlayTrigger
    overlay={
      <Tooltip id="validation">
        As you edit your project below, it will be validated against the schema currently selected for it.
      </Tooltip>
    }
  >
    <i className="bi bi-info-circle me-1 mb-1"></i>
  </OverlayTrigger>
);
