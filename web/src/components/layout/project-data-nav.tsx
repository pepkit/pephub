import { FC } from 'react';

import { ProjectViewAnnotation } from '../../../types';
import { useProjectPage } from '../../contexts/project-page-context';
import { ViewSelector } from '../project/view-selector';

type PageView = 'samples' | 'subsamples' | 'config';

interface NavProps {
  samplesIsDirty: boolean;
  subsamplesIsDirty: boolean;
  configIsDirty: boolean;
  projectViewIsLoading: boolean;
  projectViews: ProjectViewAnnotation[] | undefined;
  projectView: string | undefined;
  setProjectView: (view: string | undefined) => void;
}

interface ViewButtonProps {
  view: PageView;
  icon: string;
  text: string;
  isDirty: boolean;
}

const ViewButton: FC<ViewButtonProps> = ({ view, icon, text, isDirty }) => {
  const { setPageView } = useProjectPage();
  return (
    <div>
      <button onClick={() => setPageView(view)} className="border-0 bg-transparent mr-4">
        <span className="text-xs">
          <i className="bi bi-circle-fill ms-1 text-transparent"></i>
        </span>
        <i className={icon}></i>
        {text}
        {isDirty ? (
          <span className="text-xs">
            <i className="bi bi-circle-fill ms-1 text-primary-light"></i>
          </span>
        ) : (
          //  spacer
          <span className="text-xs">
            <i className="bi bi-circle-fill ms-1 text-transparent"></i>
          </span>
        )}
      </button>
    </div>
  );
};

export const ProjectDataNav: FC<NavProps> = ({
  samplesIsDirty,
  subsamplesIsDirty,
  configIsDirty,
  projectViewIsLoading,
  projectViews,
  projectView,
  setProjectView,
}) => {
  const { pageView } = useProjectPage();

  return (
    <div className="w-100 d-flex flex-row align-items-center">
      <div
        className={
          pageView === 'samples'
            ? 'border border-grey border-bottom-0 rounded-top shadow-sm bg-solid px-1 py-2 text-muted'
            : 'px-2 py-1'
        }
      >
        <ViewButton view="samples" icon="bi bi-table me-2" text="Samples" isDirty={samplesIsDirty} />
      </div>
      <div
        className={
          pageView === 'subsamples'
            ? 'border border-grey border-bottom-0 rounded-top shadow-sm bg-solid px-1 py-2'
            : 'px-2 py-1'
        }
      >
        <ViewButton
          view="subsamples"
          icon="bi bi-grid-3x3-gap-fill me-2"
          text="Subsamples"
          isDirty={subsamplesIsDirty}
        />
      </div>
      <div
        className={
          pageView === 'config'
            ? 'border border-grey border-bottom-0 rounded-top shadow-sm bg-solid px-1 py-2'
            : 'px-2 py-1'
        }
      >
        <ViewButton view="config" icon="bi bi-filetype-yml me-2" text="Config" isDirty={configIsDirty} />
      </div>
      <ViewSelector
        projectViewsIsLoading={projectViewIsLoading}
        projectViews={projectViews}
        view={projectView}
        setView={setProjectView}
      />
    </div>
  );
};
