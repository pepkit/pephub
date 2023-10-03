import { FC } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Placement } from 'react-bootstrap/esm/types';

interface Props {
  text?: string;
  placement?: string;
  className?: string;
}

export const GenericTooltip: FC<Props> = ({ text, placement, className }) => {
  let iconClass = 'bi bi-info-circle';
  if (className) {
    iconClass += ' ' + className;
  }
  return (
    <OverlayTrigger overlay={<Tooltip id="validation">{text}</Tooltip>} placement={placement as Placement}>
      <i className={iconClass}></i>
    </OverlayTrigger>
  );
};
