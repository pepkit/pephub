import { FC } from 'react';
import { Placeholder } from 'react-bootstrap';

interface LandingInfoPlaceholderProps {
  total?: number;
}

const PlaceholderUnit = () => {
  return (
    <Placeholder as="div" animation="glow">
      <Placeholder className="rounded" bg="secondary" xs={6} />
    </Placeholder>
  );
};

export const LandingInfoPlaceholder: FC<LandingInfoPlaceholderProps> = ({ total }) => {
  total = total || 3;
  // map over total and return PlaceholderUnit
  return (
    <>
      {Array.from(Array(total).keys()).map((_, index) => (
        <PlaceholderUnit key={index} />
      ))}
    </>
  );
};
