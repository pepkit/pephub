import { Placeholder } from 'react-bootstrap';

export const SchemasPagePlaceholder = () => {
  return (
    <div>
      <div className="d-flex flex-row align-items-center justify-content-between p-2 w-100">
        <Placeholder as="div" animation="glow" xs={4}>
          <Placeholder className="ms-1 bg-secondary rounded-pill" size="sm" xs={3} />
          <Placeholder className="ms-1 bg-secondary rounded-pill" size="sm" xs={6} />
          <Placeholder className="ms-1 bg-secondary rounded-pill" size="sm" xs={2} />
          <Placeholder className="ms-1 bg-secondary rounded-pill" size="sm" xs={4} />
          <Placeholder className="ms-1 bg-secondary rounded-pill" size="sm" xs={6} />
        </Placeholder>
        <Placeholder as="div" animation="glow" xs={4}>
          <Placeholder.Button className="mx-1" variant="success" xs={3} size="sm" />
          <Placeholder.Button className="mx-1" variant="dark" xs={3} size="sm" />
        </Placeholder>
      </div>
      <div className="w-100 d-flex align-items-center">
        <Placeholder as="div" animation="glow" xs={12}>
          <Placeholder className="p-2 ms-1 bg-secondary rounded-pill" size="sm" xs={12} />
        </Placeholder>
      </div>
      <div className="d-flex flex-wrap gap-2 mt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Placeholder as="div" animation="glow" key={i} xs={3} className="my-2">
            <Placeholder style={{ height: '100px' }} className="rounded" size="lg" bg="secondary" xs={12} />
          </Placeholder>
        ))}
      </div>
    </div>
  );
};
