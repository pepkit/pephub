import { FC } from 'react';
import { Nav } from './nav';
import { SEO } from './seo';
import { useApiBase } from '../../hooks/queries/useApiBase';

interface Props {
  children: React.ReactNode;
  title?: string;
  description?: string;
  image?: string;
}

export const PageLayout: FC<Props> = ({ children, title, description, image }) => {
  const { data } = useApiBase();

  // global search bar shortcut
  window.addEventListener('keydown', (e) => {
    if (e.key === '/') {
      e.preventDefault();
      const searchInput = document.getElementById('global-search-bar');
      if (searchInput) {
        searchInput.focus();
      }
    }
  });

  return (
    <>
      <SEO title={title} description={description} image={image} />
      <header>
        <Nav />
      </header>
      <main className="container container-height">{children}</main>
      <div className="container">
        <footer className="flex-wrap py-3 my-4 align-top d-flex justify-content-between align-items-center border-top">
          <span className="badge rounded-pill bg-secondary me-1">pephub {data?.pephub_version}</span>
          <span className="badge rounded-pill bg-secondary me-1">peppy {data?.peppy_version}</span>
          <span className="badge rounded-pill bg-secondary me-1">Python {data?.python_version}</span>
          <div className="ms-auto">
            <a href="https://databio.org/">
              <img src="/databio_logo.svg" alt="Sheffield Computational Biology Lab" width="200" />
            </a>
          </div>
        </footer>
      </div>
    </>
  );
};
