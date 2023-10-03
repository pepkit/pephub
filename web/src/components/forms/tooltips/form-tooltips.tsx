import { FC } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

interface BaseFormTooltipProps {
  children?: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

interface FormTooltipProps {
  className?: string;
}

export const FormTooltip: FC<BaseFormTooltipProps> = ({ children, placement = 'right', className }) => {
  let iconClass = 'bi bi-info-circle text-dark';
  if (className) {
    iconClass += ` ${className}`;
  }
  return (
    <OverlayTrigger trigger={'click'} placement={placement} overlay={<Tooltip>{children}</Tooltip>}>
      <i className={iconClass}></i>
    </OverlayTrigger>
  );
};

export const SchemaTooltip: FC<FormTooltipProps> = ({ className = '' }) => {
  return (
    <FormTooltip className={className}>
      <span className="text-left">
        The schema is a JSON object that describes the structure of the data in the project. The schema is used to
        validate the data in the project and to generate the forms for data entry.{' '}
        <a href="https://schema.databio.org">Learn more</a>
      </span>
    </FormTooltip>
  );
};
