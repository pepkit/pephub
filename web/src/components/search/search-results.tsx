import { FC, Fragment, useRef } from 'react';
import { OverlayTrigger, ProgressBar } from 'react-bootstrap';

import { SearchHit } from '../../../types';
import { GitHubAvatar } from '../../components/badges/github-avatar';
import { isEllipsisActive } from '../../utils/etc';

export const NUM_RESULTS_PER_PAGE = 10;

interface SearchResultProps {
  limit: number;
  hits: SearchHit[];
  offset: number;
  total: number;
  setOffset: (offset: number) => void;
}

const HitCard = ({ hit }: { hit: SearchHit }) => {
  const [namespace, projectTag] = hit.payload.registry.split('/');
  const [project, tag] = projectTag.split(':');

  // round to 2 decimal places
  let hit_score = Math.round(hit.score * 100) / 100;

  const descriptionRef = useRef<HTMLElement>(null);

  return (
    <div className="border-bottom border-dark border-2 mt-2 p-1">
      <div className="d-flex flex-row align-items-center justify-content-between">
        <a className="underline-none" href={`/${namespace}/${project}?tag=${tag}`}>
          <h5 className="fw-bold">{hit.payload.registry}</h5>
        </a>
        <div className="w-25 d-flex justify-content-end">
          <div className="w-50">
            <ProgressBar className="text-xs" variant="success" now={hit.score * 100} label={`${hit_score * 100}%`} />
          </div>
        </div>
      </div>
      <OverlayTrigger
        placement="top"
        overlay={
          isEllipsisActive(descriptionRef.current) && hit.payload.description ? (
            <div
              className="p-2 rounded bg-dark text-white text-xs"
              style={{
                maxWidth: '800px',
              }}
            >
              <p className="m-0">{hit.payload.description}</p>
            </div>
          ) : (
            <></>
          )
        }
        delay={{ show: 250, hide: 400 }}
      >
        <p
          // @ts-ignore
          ref={descriptionRef}
          className="text-secondary line-clamp cursor"
          style={{ fontSize: '0.9rem' }}
        >
          {hit.payload.description}
        </p>
      </OverlayTrigger>
    </div>
  );
};

export const ProjectSearchResults: FC<SearchResultProps> = ({ hits, offset, setOffset, limit }) => {
  if (hits.length === 0 && offset === 0)
    return (
      <div className="text-muted d-flex flex-column align-items-center justify-content-center border-top py-4">
        <p className="mb-1">No projects found :(</p>
        <p>Try broadening your search</p>
      </div>
    );
  else if (hits.length === 0 && offset !== 0) {
    return (
      <div className="text-muted d-flex flex-column align-items-center justify-content-center border-top py-4">
        <p className="mb-1">No more projects found :(</p>
        <p>Try broadening your search</p>
        <div className="d-flex flex-row align-items-center justify-content-center gap-2 mt-2">
          <button
            disabled={offset === 0}
            className="btn btn-sm btn-outline-dark"
            onClick={() => {
              setOffset(offset - limit);
            }}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }
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
                  setOffset(offset - limit);
                }}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-outline-dark"
                onClick={() => {
                  setOffset(offset + limit);
                }}
              >
                More
              </button>
            </div>
            <div className="d-flex align-items-center justify-content-center mt-2">
              <span className="me-1">Page {Math.floor(offset / limit) + 1}</span>
            </div>
            <div className="d-flex align-items-center justify-content-center">
              <button
                className="btn btn-sm btn-link shadow-none"
                onClick={() => {
                  setOffset(0);
                }}
              >
                Go to beginning
              </button>
            </div>
          </Fragment>
        )}
      </div>
    </div>
  );
};

type NamespaceHit = {
  namespace: string;
  number_of_projects: number;
  number_of_samples: number;
};

interface NamespaceProps {
  hits: NamespaceHit[];
}

export const NamespaceSearchResults: FC<NamespaceProps> = ({ hits }) => {
  if (hits.length === 0) {
    return (
      <div className="text-muted d-flex flex-column align-items-center justify-content-center py-4">
        <p className="mb-1">No namespaces with current query, and offset(</p>
        <p>Try broadening your search</p>
      </div>
    );
  }
  return (
    <Fragment>
      <h2 className="fw-bold">Namespaces</h2>
      {hits.map((hit) => (
        <div key={hit.namespace} className="d-flex flex-row align-items-center mt-2">
          <GitHubAvatar namespace={hit.namespace} height={30} width={30} />
          <a href={`/${hit.namespace}`} className="ms-1">
            <h5 className="fw-bold m-0">{hit.namespace}</h5>
          </a>
          <small className="text-muted ms-2">{hit.number_of_projects} projects</small>
        </div>
      ))}
    </Fragment>
  );
};
