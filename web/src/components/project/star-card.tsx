import { ProjectAnnotation } from '../../../types';

interface StarCardProps {
  star: ProjectAnnotation;
}

export const StarCard = (props: StarCardProps) => {
  const { star } = props;
  return (
    <div
      id={`star-card-${star.namespace}/${star.name}:${star.tag}`}
      className="w-100 border-top border-bottom border-dark p-2 mt-3"
    >
      <div className="d-flex flex-row align-items-center">
        <a className="fw-bold fs-5" href={`${star.namespace}/${star.name}?tag=${star.tag}`}>
          {star.namespace}/{star.name}:{star.tag}
        </a>
        {star.is_private ? (
          <span className="ms-2 badge text-dark rounded-pill border border-dark">Private</span>
        ) : (
          <span className="ms-2 badge text-dark rounded-pill border border-dark">Public</span>
        )}
        {star.pop ? (
          <span className="ms-2 badge bg-primary text-white rounded-pill border border-primary flex align-items-center bg-opacity-75">
            <img src="/popcorn-white.svg" height="10px" width="10px" alt="Popcorn icon" className="me-1 text-primary" />
            POP
          </span>
        ) : null}
      </div>
    </div>
  );
};
