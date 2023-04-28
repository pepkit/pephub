import { FC } from 'react';
import { Nav } from './nav';
import { SEO } from './seo';
import { useApiBase } from '../../hooks/queries/useApiBase';
import { getOS } from '../../utils/etc';

interface Props {
  children: React.ReactNode;
  title?: string;
  description?: string;
  image?: string;
  fullWidth?: boolean;
  footer?: boolean;
}

interface FooterProps {
  data?: {
    pephub_version: string;
    peppy_version: string;
    python_version: string;
  };
}

const Footer: FC<FooterProps> = ({ data }) => {
  return (
    <div className="container">
      <footer className="flex-wrap py-3 my-4 align-top d-flex justify-content-between align-items-center border-top">
        <span className="badge rounded-pill bg-secondary me-1">pephub {data?.pephub_version || ''}</span>
        <span className="badge rounded-pill bg-secondary me-1">peppy {data?.peppy_version || ''}</span>
        <span className="badge rounded-pill bg-secondary me-1">Python {data?.python_version || ''}</span>
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
  const { data } = useApiBase();
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
      {footer && <Footer data={data} />}
    </>
  );
};
