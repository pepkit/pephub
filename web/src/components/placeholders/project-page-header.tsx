import { FC } from 'react';
import { Placeholder } from 'react-bootstrap';

export const ProjectPageheaderPlaceholder: FC = () => (
  <>
    <Placeholder as="div" animation="glow">
      <Placeholder className="rounded" bg="secondary" xs={6} />
    </Placeholder>
    <Placeholder as="div" animation="glow">
      <Placeholder className="rounded" bg="secondary" xs={6} />
    </Placeholder>
  </>
);
