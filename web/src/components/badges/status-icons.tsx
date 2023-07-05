import { FC } from 'react';

interface Props {
  variant: string;
  size?: string;
  className?: string;
}

export const StatusIcon: FC<Props> = ({ variant, size, className }) => {
  let iconClass = '';
  if (variant === 'success') {
    iconClass = 'bi bi-check';
  } else if (variant === 'danger') {
    iconClass = 'bi bi-x';
  } else if (variant === 'warning') {
    iconClass = 'bi bi-exclamation-triangle';
  } else {
    // unreachable
  }

  let padding = '';
  switch (size) {
    case 'small':
      padding = 'p-1';
      break;
    case 'medium':
      padding = 'p-2';
      break;
    case 'large':
      padding = 'p-3';
      break;
    default:
      padding = 'p-2';
      break;
  }

  let classNameString = `${padding} text-${variant} ${iconClass}`;

  if (className) {
    classNameString = `${classNameString} ${className}`;
  }

  return <i className={classNameString} />;
};
