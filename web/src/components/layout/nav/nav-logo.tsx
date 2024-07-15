import { Fragment } from 'react';

import { useSession } from '../../../contexts/session-context';

export const NavLogo = () => {
  const { user } = useSession();
  return (
    <Fragment>
      {user ? (
        <div>
          <a
            href={`/${user.login}`}
            className="mb-3 align-items-center mb-md-0 me-md-auto text-dark text-decoration-none"
          >
            <img src="/pephub_logo.svg" alt="PEPhub" height="60" />
          </a>
        </div>
      ) : (
        <a href="/" className="mb-3 align-items-center mb-md-0 me-md-auto text-dark text-decoration-none">
          <img src="/pephub_logo.svg" alt="PEPhub" height="60" />
        </a>
      )}
    </Fragment>
  );
};
