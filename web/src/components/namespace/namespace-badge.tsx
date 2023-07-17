import { FC } from 'react';

import { GitHubAvatar } from '../badges/github-avatar';

interface Props {
  namespace: string;
  className?: string;
}

export const NamespaceBadge: FC<Props> = ({ namespace, className }) => {
  let classFull = 'd-flex align-items-center';
  if (className) {
    classFull += ` ${className}`;
  }
  return (
    <span className={classFull}>
      <GitHubAvatar namespace={namespace} height={20} width={20} />{' '}
      <span className="ms-1 fw-normal text-decoration-none">{namespace}</span>
    </span>
  );
};
