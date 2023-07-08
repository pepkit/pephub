import { FC } from 'react';

import { useApiBase } from '../../hooks/queries/useApiBase';
import { getOS } from '../../utils/etc';
import { StatusCircle } from '../badges/status-circles';
import { Nav } from './nav';
import { SEO } from './seo';

interface Props {
  children: React.ReactNode;
  title?: string;
  description?: string;
  image?: string;
  fullWidth?: boolean;
  footer?: boolean;
}

const Footer: FC = () => {
  const { data, isLoading, isFetching } = useApiBase();
  return (
    <div className="container">
      <footer className="flex-wrap py-3 my-4 align-top d-flex justify-content-between align-items-center border-top">
        <div className="d-flex flex-column">
          <div>
            <span className="badge rounded-pill bg-secondary me-1">pephub {data?.pephub_version || ''}</span>
            <span className="badge rounded-pill bg-secondary me-1">peppy {data?.peppy_version || ''}</span>
            <span className="badge rounded-pill bg-secondary me-1">Python {data?.python_version || ''}</span>
          </div>
          <div className="d-flex flex-row mt-1 align-items-center">
            {isLoading || isFetching ? (
              <>
                <StatusCircle className="me-1" variant="warning" size="small" />
                Loading...
              </>
            ) : data?.api_version ? (
              <>
                <StatusCircle className="me-1" variant="success" size="small" />
                Connected
              </>
            ) : (
              <>
                <StatusCircle className="me-1" variant="danger" size="small" />
                No connection
              </>
            )}
          </div>
        </div>
        <div className="ms-auto">
          <a href="https://databio.org/">
            <img src="/databio_logo.svg" alt="Sheffield Computational Biology Lab" width="200" />
          </a>
        </div>
      </footer>
    </div>
  );
};

export const PageLayout: FC<Props> = ({ children, title, description, image, fullWidth, footer = true }) => {
  const os = getOS();
  const searchInput = document.getElementById('global-search-bar');

  // add macOS keybinding
  if (os === 'Mac OS') {
    // global search bar shortcut
    window.addEventListener('keydown', (e) => {
      // detect ctrl + k key press
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        // make sure no other elements are focused
        if (searchInput) {
          searchInput.focus();
        }
      }
    });
    // add windows/linux keybinding
  } else {
    // global search bar shortcut
    window.addEventListener('keydown', (e) => {
      // detect ctrl + k key press
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        // make sure no other elements are focused
        if (searchInput) {
          searchInput.focus();
        }
      }
    });
  }

  // set main class based on fullWidth prop
  const mainClass = fullWidth ? `container-height` : 'container container-height';

  return (
    <>
      <SEO title={title} description={description} image={image} />
      <header>
        <Nav />
      </header>
      <main className={mainClass}>{children}</main>
      {footer && <Footer />}
    </>
  );
};
