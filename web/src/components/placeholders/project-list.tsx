import { FC } from 'react';
import { Placeholder } from 'react-bootstrap';

export const ProjectListPlaceholder: FC = () => (
  <>
    {/* create 10 placeholders */}
    {[...Array(10)].map((_, i) => (
      <Placeholder className="my-2" as="div" animation="glow" key={i}>
        <Placeholder className="rounded" size="lg" bg="secondary" xs={12} />
      </Placeholder>
    ))}
  </>
);
