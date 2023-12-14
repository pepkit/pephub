import { FC, Fragment } from 'react';
import { ProgressBar } from 'react-bootstrap';

import { SearchHit } from '../../../types';
import { GitHubAvatar } from '../../components/badges/github-avatar';

interface SearchResultProps {
  hits: SearchHit[];
  offset: number;
  setOffset: (offset: number) => void;
  numResultsPerPage: number;
}

const HitCard = ({ hit }: { hit: SearchHit }) => {
  const [namespace, projectTag] = hit.payload.registry.split('/');
  const [project, tag] = projectTag.split(':');

  // round to 2 decimal places
  let hit_score = Math.round(hit.score * 100) / 100;

  return (
    <div className="border-bottom border-dark border-2 mt-2 p-1">
      <div className="d-flex flex-row align-items-center justify-content-between">
        <a className="underline-none" href={`/${namespace}/${project}?tag=${tag}`}>
          <h5 className="fw-bold">{hit.payload.registry}</h5>
        </a>
        <div className="w-25">
          <ProgressBar variant="success" now={hit.score * 100} label={`${hit_score * 100}%`} />
        </div>
      </div>
      <p className="truncate text-secondary" style={{ fontSize: '0.9rem' }}>
        {hit.payload.description}
      </p>
    </div>
  );
};

export const ProjectSearchResults: FC<SearchResultProps> = ({ hits, offset, setOffset, numResultsPerPage }) => {
  if (hits.length === 0)
    return (
      <div
        className="text-muted d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: '50vh' }}
      >
        <p className="mb-1">No projects found :(</p>
        <p>Try lowering your score threshold</p>
      </div>
    );
  return (
    <div>
      <br />
      <h2 className="fw-bold">Projects</h2>
      {hits.map((hit, i) => (
        <HitCard hit={hit} key={i} />
      ))}
      <div className="mt-3">
        {hits.length > 0 && (
          <Fragment>
            <div className="d-flex flex-row align-items-center justify-content-center gap-2">
              <button
                disabled={offset === 0}
                className="btn btn-sm btn-outline-dark"
                onClick={() => {
                  setOffset(offset - numResultsPerPage);
                }}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-outline-dark"
                onClick={() => {
                  setOffset(offset + numResultsPerPage);
                }}
              >
                More
              </button>
            </div>
            <div className="d-flex align-items-center justify-content-center mt-2">
              <span className="me-1">
                Showing results {offset + 1} - {offset + numResultsPerPage}
              </span>
              {/* <span className="badge bg-primary bg-opacity-25 text-primary">{hits.length}</span> */}
            </div>
          </Fragment>
        )}
      </div>
    </div>
  );
};

interface NamespaceProps {
  hits: string[];
}

export const NamespaceSearchResults: FC<NamespaceProps> = ({ hits }) => {
  if (hits.length === 0) {
    return (
      <div
        className="text-muted d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: '50vh' }}
      >
        <p className="mb-1">No namespaces found :(</p>
        <p>Try lowering your score threshold</p>
      </div>
    );
  }
  return (
    <>
      <h2 className="fw-bold">Namespaces</h2>
      {hits.map((hit) => (
        <div key={hit} className="d-flex flex-row align-items-center mt-2">
          <GitHubAvatar namespace={hit} height={30} width={30} />
          <a href={`/${hit}`} className="ms-1">
            <h5 className="fw-bold m-0">{hit}</h5>
          </a>
        </div>
      ))}
    </>
  );
};
