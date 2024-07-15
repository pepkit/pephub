import { Placeholder } from 'react-bootstrap';

export const ProjectDescriptionPlaceholder = () => {
  return (
    <div className="d-flex flex-row align-items-center justify-content-between p-2">
      <Placeholder as="div" animation="glow" xs={4}>
        <Placeholder className="ms-1 bg-secondary rounded-pill" size="sm" xs={3} />
        <Placeholder className="ms-1 bg-secondary rounded-pill" size="sm" xs={6} />
        <Placeholder className="ms-1 bg-secondary rounded-pill" size="sm" xs={2} />
        <Placeholder className="ms-1 bg-secondary rounded-pill" size="sm" xs={4} />
        <Placeholder className="ms-1 bg-secondary rounded-pill" size="sm" xs={6} />
      </Placeholder>
    </div>
  );
};
