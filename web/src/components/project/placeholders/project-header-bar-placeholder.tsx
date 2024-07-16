import { Placeholder } from 'react-bootstrap';

export const ProjectHeaderBarPlaceholder = () => {
  return (
    <div className="d-flex flex-row align-items-center justify-content-between p-2">
      <Placeholder as="div" animation="glow" xs={4}>
        <Placeholder className="ms-1 bg-secondary" size="lg" xs={3} />
        <Placeholder className="ms-1 bg-secondary" size="lg" xs={4} />
        <Placeholder className="ms-1 bg-secondary" size="lg" xs={4} />
      </Placeholder>
      <div className="w-50 d-flex flex-row align-items-center justify-content-end gap-1">
        <Placeholder.Button size="xs" variant="outline-dark" className="p-1" xs={2} />
        <Placeholder.Button size="xs" variant="dark" className="p-1" xs={2} />
        <Placeholder.Button size="xs" variant="outline-dark" className="p-1" xs={2} />
      </div>
    </div>
  );
};
