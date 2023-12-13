import { OverlayTrigger, Tooltip } from 'react-bootstrap';

export const PleaseLoginTooltip = () => (
  <OverlayTrigger overlay={<Tooltip id="validation">Please log in to fork a project.</Tooltip>}>
    <i className="bi bi-info-circle me-1 mb-1"></i>
  </OverlayTrigger>
);
