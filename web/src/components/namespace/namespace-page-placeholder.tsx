import { Placeholder } from 'react-bootstrap';

import { ProjectCardPlaceholder } from '../placeholders/project-card-placeholder';

export const NamespacePagePlaceholder = () => {
  return (
    <div>
      <div className="w-100 d-flex align-items-center justify-content-between mt-3">
        {/* breadcrumbs */}
        <Placeholder as="div" animation="glow" xs={4}>
          <div className="d-flex align-items-center">
            <Placeholder className="ms-1" size="lg" xs={4} />
            <Placeholder className="ms-1" size="lg" xs={6} />
          </div>
        </Placeholder>
        {/* try to replace avatar + name */}
        <Placeholder as="div" animation="glow" xs={4}>
          <div className="d-flex align-items-center">
            <Placeholder className="ms-1" size="lg" xs={4} />
            <Placeholder className="ms-1" size="lg" xs={6} />
          </div>
        </Placeholder>
        {/* replace buttons */}
        <div className="w-50 d-flex flex-row align-items-center gap-1">
          <Placeholder.Button size="sm" variant="outline-dark" className="ms-1" xs={4} />
          <Placeholder.Button size="sm" variant="dark" className="ms-1" xs={4} />
          <Placeholder.Button size="sm" variant="success" className="ms-1" xs={4} />
        </div>
      </div>
      <div className="mt-3">
        {/*  orgs and total projects */}
        <Placeholder as="div" animation="glow" xs={4}>
          <div className="d-flex flex-column align-items-start gap-2">
            <Placeholder className="ms-1" size="lg" xs={12} />
            <Placeholder className="ms-1" size="lg" xs={6} />
          </div>
        </Placeholder>
      </div>
      <div className="mt-3">
        {/* navigation buttons */}
        <div className="w-25">
          <Placeholder.Button variant="outline-primary" className="ms-1" xs={4} />
          <Placeholder.Button variant="outline-primary" className="ms-1" xs={4} />
        </div>
      </div>
      <div className="my-3 border-top"></div>
      {/* Search bar */}
      <Placeholder as="div" animation="glow" xs={4}>
        <div className="d-flex align-items-center">
          <Placeholder size="lg" xs={12} />
          <Placeholder size="lg" xs={12} />
          <Placeholder size="lg" xs={12} />
        </div>
      </Placeholder>
      {Array.from({ length: 5 }).map((_, i) => (
        <ProjectCardPlaceholder key={i} />
      ))}
    </div>
  );
};
