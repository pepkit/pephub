import { FC } from 'react';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
type Size = 'small' | 'medium' | 'large';

interface Props {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
  className?: string;
}

export const Badge: FC<Props> = ({ variant = 'primary', size = 'medium', children, className }) => {
  // switcher for the variant
  let highlight = '';
  switch (variant) {
    case 'primary':
      highlight = 'primary';
      break;
    case 'secondary':
      highlight = 'secondary';
      break;
    case 'success':
      highlight = 'success';
      break;
    case 'danger':
      highlight = 'danger';
      break;
    case 'warning':
      highlight = 'warning';
      break;
    case 'info':
      highlight = 'info';
      break;
    case 'light':
      highlight = 'light';
      break;
    case 'dark':
      highlight = 'dark';
      break;
    default:
      highlight = 'primary';
      break;
  }

  let fontSize = '';
  switch (size) {
    case 'small':
      fontSize = '0.8rem';
      break;
    case 'medium':
      fontSize = '1.0rem';
      break;
    case 'large':
      fontSize = '1.2rem';
      break;
    default:
      fontSize = '1.0rem';
      break;
  }
  let classNameString = `d-flex flex-row align-items-center shadow-sm px-2 py-1 fw-semibold text-${highlight} bg-${highlight} bg-opacity-10 border border-${highlight} border-opacity-10 rounded-2`;

  if (className) {
    classNameString = `${classNameString} ${className}`;
  }

  return (
    <span className={classNameString} style={{ fontSize: fontSize }}>
      {children}
    </span>
  );
};
