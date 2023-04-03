import { FC } from 'react';
import { SearchHit } from '../../../types';
import { ProgressBar } from 'react-bootstrap';

interface ProjectProps {
  hits: SearchHit[];
}

const HitCard = ({ hit }: { hit: SearchHit }) => {
  const [namespace, projectTag] = hit.payload.registry.split('/');
  const [project, tag] = projectTag.split(':');
  return (
    <div className="border-bottom border-dark border-2 mt-2 p-1">
      <div className="d-flex flex-row align-items-center justify-content-between">
        <a className="underline-none" href={`/${namespace}/${project}?tag=${tag}`}>
          <h5 className="fw-bold">{hit.payload.registry}</h5>
        </a>
        <div className="w-25">
          <ProgressBar variant="success" now={hit.score * 100} label={`${hit.score}%`} />
        </div>
      </div>
      <p className="truncate text-secondary" style={{ fontSize: '0.9rem' }}>
        {hit.payload.description}
      </p>
    </div>
  );
};

export const ProjectSearchResults: FC<ProjectProps> = ({ hits }) => {
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
      <h2 className="fw-bold">Projects</h2>
      {hits.map((hit, i) => (
        <HitCard hit={hit} key={i} />
      ))}
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
        <div key={hit} className="d-flex flex-row align-items-center">
          <i className="bi bi-folder me-2"></i>
          <a href={`/${hit}`}>
            <h5 className="fw-bold">{hit}</h5>
          </a>
        </div>
      ))}
    </>
  );
};
