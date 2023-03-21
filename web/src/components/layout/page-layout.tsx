import { FC } from 'react';
import useSWR from 'swr';
import { Fetcher } from 'swr';
import { ApiBase, getApiBase } from '../../api/server';
import { Nav } from './nav';
import { SEO } from './seo';

interface Props {
  children: React.ReactNode;
  title?: string;
  description?: string;
  image?: string;
}

const apibaseFetcher: Fetcher<ApiBase> = () => getApiBase();

export const PageLayout: FC<Props> = ({ children, title, description, image }) => {
  const { data } = useSWR('apibase', apibaseFetcher);
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
