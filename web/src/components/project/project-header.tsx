import { ProjectInfoFooter } from './project-info-footer';
import { ProjectDescription } from './project-page-description';
import { ProjectHeaderBar } from './project-page-header-bar';

export const ProjectHeader = () => {
  return (
    <div className="shadow-sm pt-2">
      <ProjectHeaderBar />
      <ProjectDescription />
      <ProjectInfoFooter />
    </div>
  );
};
