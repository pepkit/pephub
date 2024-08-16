import React from 'react';

type SpinnerProps = {
  fillClassName?: string;
  className?: string;
};

export const LoadingSpinner = (props: SpinnerProps) => {
  const { className, fillClassName } = props;
  const sClassName = `${className || ''}`.trim();
  const gClassName = `spinner-pulse ${fillClassName || ''}`.trim();

  return (
    <>
      <svg className={sClassName} width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <g className={gClassName}>
          <circle cx="12" cy="3" r="2" />
          <circle cx="18.36" cy="5.64" r="2" />
          <circle cx="21" cy="12" r="2" />
          <circle cx="18.36" cy="18.36" r="2" />
          <circle cx="12" cy="21" r="2" />
          <circle cx="5.64" cy="18.36" r="2" />
          <circle cx="3" cy="12" r="2" />
          <circle cx="5.64" cy="5.64" r="2" />
        </g>
      </svg>
    </>
  );
};

export default LoadingSpinner;