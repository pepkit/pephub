import { AnimatePresence, motion } from 'framer-motion';
import { FC, useState } from 'react';
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import { GitHubAvatar } from '../../components/badges/github-avatar';
import { useSession } from '../../hooks/useSession';
import { getOS } from '../../utils/etc';
import { SearchBox } from './search-box';

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
      Try searching for some metadata! Try cohesin, or CTCF, or any other keyword.
    </Tooltip>
  );
};

// bootstrap nav bar
export const Nav: FC = () => {
  const { login, user, logout } = useSession();
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState<boolean>(true);

  // remove after 5 seconds
  setTimeout(() => {
    setShowTooltip(false);
  }, 5000);

  const navigateToSearch = () => {
    navigate(`/search?query=${globalSearch}`);
  };

  const os = getOS();

  return (
    <nav
      className="py-2 navbar navbar-expand-md border-bottom navbar-light"
      aria-label="navbar"
      style={{ backgroundColor: '#EFF3F6' }}
    >
      <div className="d-flex flex-row align-items-center w-100 px-4">
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
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse me-auto" id="navbarSupportedContent">
          <ul className="mb-2 navbar-nav ms-auto d-flex flex-row align-items-center">
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
                        {showTooltip && (
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
              <a className="nav-link" href={`${API_HOST}/api/v1/docs`}>
                <i className="me-1 bi bi-journal"></i>
                API docs
              </a>
            </li>
            <li className="text-body mx-2 my-0 nav-item h5 pt-1">
              <a className="nav-link" href="https://github.com/pepkit/pephub" target="_blank">
                <i className="me-1 bi bi-github"></i>
                GitHub
              </a>
            </li>
            <li className="text-body mx-2 my-0 nav-item h5 pt-1">
              <a className="nav-link" href="/validate">
                <i className="bi bi-check2-circle me-1"></i>Validation
              </a>
            </li>
            <li className="text-body mx-2 my-0 nav-item h5 pt-1">
              {user ? (
                <div className="mx-2 my-0 nav-item h5 pt-1">
                  <Dropdown className="me-3">
                    <Dropdown.Toggle className="shadow-none" variant="none" id="navbarDropdown">
                      <GitHubAvatar namespace={user['login']} height={40} width={40} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="border border-dark shadow-lg">
                      <Dropdown.Item href={`/${user.login}`}>My PEPs</Dropdown.Item>
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
                        <>
                          <OverlayTrigger
                            overlay={
                              <Tooltip id="orgs">
                                Below would be a list of organizations you belong to. If you are a part of an
                                organization but don't see it here, you may need to make your membership public on
                                GitHub then log out and log back in here.{' '}
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
                        </>
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
        </div>
      </div>
    </nav>
  );
};
