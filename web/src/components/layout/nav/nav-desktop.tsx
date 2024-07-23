import { AnimatePresence, motion } from 'framer-motion';
import { Fragment, useState } from 'react';
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import { useSession } from '../../../contexts/session-context';
import { getOS } from '../../../utils/etc';
import { GitHubAvatar } from '../../badges/github-avatar';
import { SearchBox } from '../search-box';

const API_HOST = import.meta.env.VITE_API_HOST || '';

const SearchBoxTooltip = () => {
  // always show
  return (
    <Tooltip
      placement="top"
      id="search-box-tooltip"
      style={{
        opacity: 1,
        transform: 'translateY(-10px)',
      }}
      arrowProps={{
        // rotate 180 degrees
        style: {
          transform: 'rotate(180deg)',
          // shift right by 10px
          translate: '10px',
        },
      }}
      className="text-start"
    >
      Try searching for some metadata! Try bone marrow, or scATAC-seq, or even a specific gene like TP53.
    </Tooltip>
  );
};

export const NavDesktop = () => {
  const { user, login, logout } = useSession();

  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');
  const [showTooltip, setShowTooltip] = useState(true);

  // on landing page?
  const isLandingPage = window.location.pathname === '/';

  // remove after 5 seconds
  setTimeout(() => {
    setShowTooltip(false);
  }, 5000);

  const navigateToSearch = () => {
    navigate(`/search?query=${globalSearch}`);
  };

  const os = getOS();

  return (
    <ul className="mb-2 ms-auto d-flex flex-row align-items-center gap-2 list-none">
      <li>
        <div className="mt-1 input-group">
          {user ? (
            <SearchBox
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigateToSearch();
                }
              }}
              onClick={() => setShowTooltip(false)}
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              id="global-search-bar"
              type="text"
              className="form-control border-end-0 shadow-sm"
              placeholder="Search pephub"
              aria-label="search"
              aria-describedby="search"
            />
          ) : (
            <>
              <motion.div
                animate="visible"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <SearchBox
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigateToSearch();
                    }
                  }}
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  id="global-search-bar"
                  type="text"
                  className="form-control border-end-0 shadow-sm rounded-0 rounded-start"
                  placeholder="Search pephub"
                  aria-label="search"
                  aria-describedby="search"
                />
                <AnimatePresence>
                  {showTooltip && isLandingPage && (
                    <motion.div
                      className="d-block position-absolute top-100"
                      // "pop" in the tooltip
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      style={{
                        left: '-5px',
                      }}
                      // shrink away after 3 seconds
                      exit={{
                        opacity: 0,
                        // remove spring transition
                        transition: { duration: 0.1 },
                      }}
                    >
                      <SearchBoxTooltip />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}
          <span className="input-group-text border-start-0 shadow-sm">
            <div className="px-1 border rounded border-secondary text-secondary text-sm">
              {os === 'Mac OS' ? <i className="bi bi-command"></i> : 'ctrl'}
            </div>
            <div className="ms-1 px-1 border rounded border-secondary text-secondary text-sm">K</div>
          </span>
        </div>
      </li>
      <li className="text-body mx-2 my-0 nav-item h5 pt-1">
        <a className="nav-link" href="https://github.com/pepkit/pephub" target="_blank">
          <i className="me-1 bi bi-github text-base"></i>
          GitHub
        </a>
      </li>
      <li className="text-body mx-2 my-0 nav-item h5 pt-1">
        <a className="nav-link" href="/validate">
          <i className="bi bi-check2-circle me-1 text-base"></i>Validation
        </a>
      </li>
      <li className="text-body mx-2 my-0 nav-item h5 pt-1">
        <a className="nav-link" href="https://pep.databio.org/pephub">
          <i className="bi bi-info-circle me-1 text-base"></i>Docs
        </a>
      </li>
      <li className="text-body mx-2 my-0 nav-item h5 pt-1">
        {user ? (
          <div className="mx-2 my-0 nav-item h5 pt-1">
            <Dropdown className="me-3">
              <Dropdown.Toggle className="shadow-none" variant="none" id="navbarDropdown">
                <GitHubAvatar namespace={user.login} height={40} width={40} />
              </Dropdown.Toggle>
              <Dropdown.Menu className="border border-dark shadow-lg">
                <Dropdown.Header className="d-flex flex-row align-items-center">
                  <GitHubAvatar namespace={user.login} height={20} width={20} />
                  <div className="d-flex flex-column">
                    <span className="ms-2">{user.login}</span>
                    <span className="ms-2 text-xs">{user.company}</span>
                  </div>
                </Dropdown.Header>
                <Dropdown.Divider />
                <Dropdown.Item href={`/${user.login}`}>
                  <i className="bi bi-person me-1"></i>
                  My PEPs
                </Dropdown.Item>
                <Dropdown.Item href={`/${user.login}?view=stars`}>
                  <i className="bi bi-star me-1"></i>
                  Stars
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Header>Organizations</Dropdown.Header>
                {user?.orgs.length > 0 ? (
                  user.orgs.map((org) => (
                    <Dropdown.Item key={org} eventKey={org}>
                      <a
                        className="dropdown-item d-flex align-items-center"
                        href={`/${org}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GitHubAvatar namespace={org} height={20} width={20} />
                        <span className="ms-1">{org}</span>
                      </a>
                    </Dropdown.Item>
                  ))
                ) : (
                  <Fragment>
                    <OverlayTrigger
                      overlay={
                        <Tooltip id="orgs">
                          Below would be a list of organizations you belong to. If you are a part of an organization but
                          don't see it here, you may need to make your membership public on GitHub then log out and log
                          back in here.{' '}
                          <span>
                            More info found{' '}
                            <a
                              href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-your-membership-in-organizations/publicizing-or-hiding-organization-membership"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              here
                            </a>
                            .
                          </span>
                        </Tooltip>
                      }
                      placement="left"
                      delay={{ show: 250, hide: 1200 }}
                      trigger="hover"
                    >
                      <span>
                        <Dropdown.Item disabled>
                          No organizations found. <i className="bi bi-info-circle me-1 mb-1"></i>
                        </Dropdown.Item>
                      </span>
                    </OverlayTrigger>
                  </Fragment>
                )}
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => logout()}>Log out</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        ) : (
          <div className="my-0 nav-item h5 pt-1">
            <button className="btn btn-sm btn-dark px-3 mb-1" onClick={() => login()}>
              <i className="fa fa-github"></i>Log in
            </button>
          </div>
        )}
      </li>
    </ul>
  );
};
