import { Fragment } from 'react';
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';

import { useSession } from '../../../contexts/session-context';
import { GitHubAvatar } from '../../badges/github-avatar';

export const MobileNav = () => {
  const API_HOST = import.meta.env.VITE_API_HOST || '';
  const { login, user, logout } = useSession();
  return (
    <Dropdown className="me-3">
      <Dropdown.Toggle className="shadow-none" variant="none" id="navbarDropdown">
        {user ? <GitHubAvatar namespace={user.login} height={40} width={40} /> : <i className="bi bi-list fs-4" />}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {user && (
          <Fragment>
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
              <>
                <OverlayTrigger
                  overlay={
                    <Tooltip id="orgs">
                      Below would be a list of organizations you belong to. If you are a part of an organization but
                      don't see it here, you may need to make your membership public on GitHub then log out and log back
                      in here.{' '}
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
          </Fragment>
        )}
        <Dropdown.Item href="https://github.com/pepkit/pephub">
          <i className="bi bi-github me-2" />
          GitHub
        </Dropdown.Item>
        <Dropdown.Item href="/validate">
          <i className="bi bi-check-circle me-2" />
          Validation
        </Dropdown.Item>
        <Dropdown.Item href="/search">
          <i className="bi bi-search me-2" />
          Search
        </Dropdown.Item>
        <Dropdown.Item href="/about">
          <i className="bi bi-info-circle me-2" />
          Docs
        </Dropdown.Item>
        <Dropdown.Divider />
        {user ? (
          <Fragment>
            <Dropdown.Item onClick={logout} className="text-danger">
              <i className="bi bi-box-arrow-left me-2" />
              Logout
            </Dropdown.Item>
          </Fragment>
        ) : (
          <Fragment>
            <Dropdown.Item onClick={() => login()}>
              <i className="bi bi-box-arrow-in-right me-2" />
              Login
            </Dropdown.Item>
          </Fragment>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};
