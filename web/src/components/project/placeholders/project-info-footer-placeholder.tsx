import { Placeholder } from 'react-bootstrap';

export const ProjectInfoFooterPlaceholder = () => {
  return (
    <div className=" p-2">
      <Placeholder as="div" animation="glow" xs={4} className="d-flex flex-row align-items-center gap-5">
        <Placeholder className="bg-secondary rounded-pill" size="sm" xs={5} />
        <Placeholder className="bg-secondary rounded-pill" size="sm" xs={5} />
        <Placeholder className="bg-secondary rounded-pill" size="sm" xs={5} />
      </Placeholder>
    </div>
  );
};
