import { FC, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useSession } from '../../hooks/useSession';
import { useNavigate } from 'react-router-dom';

// bootstrap nav bar
export const Nav: FC = () => {
  const { login, user, logout } = useSession();
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState<string>('');

  const navigateToSearch = () => {
    navigate(`/search?query=${globalSearch}`);
  };

  return (
    <nav
      className="py-2 mb-4 navbar navbar-expand-md border-bottom navbar-light"
      aria-label="navbar"
      style={{ backgroundColor: '#EFF3F6' }}
    >
      <div className="container">
        <a href="/" className="mb-3 align-items-center mb-md-0 me-md-auto text-dark text-decoration-none">
          <img src="/pephub_logo.svg" alt="PEPhub" height="60" />
        </a>
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
          <ul className="mb-2 navbar-nav ms-auto mb-sm-0">
            <li>
              <div className="mt-1 input-group">
                <input
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigateToSearch();
                    }
                  }}
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  id="global-search-bar"
                  type="text"
                  className="form-control border-end-0"
                  placeholder="Search pephub"
                  aria-label="search"
                  aria-describedby="search"
                />
                <span className="input-group-text border-start-0">
                  <div className="px-2 border rounded border-secondary text-secondary">/</div>
                </span>
              </div>
              <Dropdown show={globalSearch.length > 0}>
                <Dropdown.Menu>
                  <div className="p-2">
                    Search PEPhub for <span className="fst-italic">"{globalSearch}"</span>
                    <button onClick={() => navigateToSearch()} className="ms-2 btn btn-sm btn-outline-dark">
                      Go
                      <i className="bi bi-arrow-return-left ms-1"></i>
                    </button>
                  </div>
                </Dropdown.Menu>
              </Dropdown>
            </li>
            <li className="mx-2 my-0 nav-item h5 pt-1">
              <a className="nav-link" href="/api/v1/docs">
                <i className="me-1 bi bi-journal"></i>
                API docs
              </a>
            </li>
            <li className="mx-2 my-0 nav-item h5 pt-1">
              <a className="nav-link" href="https://github.com/pepkit/pephub" target="_blank">
                <i className="me-1 bi bi-github"></i>
                GitHub
              </a>
            </li>
            <li className="mx-2 my-0 nav-item h5">
              {user ? (
                <div className="d-flex align-items-center">
                  <Dropdown className="me-3">
                    <Dropdown.Toggle variant="outline-dark" id="navbarDropdown">
                      Profile
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item href={`/${user.login}`}>View PEPs</Dropdown.Item>
                      <Dropdown.Item disabled href="/me">
                        Profile
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => logout()}>Logout</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  <img
                    className="border rounded-circle border-secondary"
                    src={user['avatar_url']}
                    alt={`Avatar for ${user['login']}`}
                    height="50"
                  />
                </div>
              ) : (
                <li className="mx-2 my-0 nav-item h5 pt-1">
                  <button className="btn btn-dark" onClick={() => login()}>
                    <i className="fa fa-github"></i>Login
                  </button>
                </li>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
