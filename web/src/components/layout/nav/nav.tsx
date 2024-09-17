import { FC, Fragment } from 'react';

import { NavDesktop } from './nav-desktop';
import { NavLogo } from './nav-logo';
import { MobileNav } from './nav-mobile';

// bootstrap nav bar
export const Nav: FC = () => {
  return (
    <Fragment>
      <nav
        className="d-flex flex-row align-items-center justify-content-between w-100 py-2 border-bottom"
        aria-label="navbar"
        style={{ height: '85px' }}
      >
        <div className="d-flex flex-row align-items-center px-4">
          <NavLogo />
        </div>
        <div className="d-flex flex-row align-items-center justify-content-end w-100">
          {/* Desktop nav */}
          <div className="d-none d-xl-flex w-100">
            <NavDesktop />
          </div>
          {/* Mobile nav */}
          <div className="d-flex d-xl-none">
            <MobileNav />
          </div>
        </div>
      </nav>
    </Fragment>
  );
};
