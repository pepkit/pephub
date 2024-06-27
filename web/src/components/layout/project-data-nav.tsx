import { FC } from 'react';

import { ProjectViewAnnotation } from '../../../types';
import { ProjectViewsResponse } from '../../api/project';
import { ViewSelector } from '../project/view-selector';

type PageView = 'samples' | 'subsamples' | 'config';

interface NavProps {
  pageView: string;
  setPageView: (view: PageView) => void;
  samplesIsDirty: boolean;
  subsamplesIsDirty: boolean;
  configIsDirty: boolean;
  projectViewIsLoading: boolean;
  projectViews: ProjectViewsResponse | undefined;
  projectView: string | undefined;
  setProjectView: (view: string | undefined) => void;
}

interface ViewButtonProps {
  view: PageView;
  setPageView: (view: PageView) => void;
  icon: string;
  text: string;
  isDirty: boolean;
  bold: string;
  color: string;
}

const ViewButton: FC<ViewButtonProps> = ({ view, setPageView, icon, text, isDirty, bold, color }) => (
  <div className="h-100">
    <button onClick={() => setPageView(view)} className={'h-100 border-0 bg-transparent mr-4' + bold + color}>
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

export const ProjectDataNav: FC<NavProps> = ({
  pageView,
  setPageView,
  samplesIsDirty,
  subsamplesIsDirty,
  configIsDirty,
  projectViewIsLoading,
  projectViews,
  projectView,
  setProjectView,
}) => {
  return (
    <div className="h-100 w-100 d-flex flex-row align-items-center">
      <div
        className={
          pageView === 'samples' ? 'border-0 px-1 h-100 text-muted bg-white shadow-sm align-middle' : 'px-1 h-100'
        }
      >
        <ViewButton
          view="samples"
          setPageView={setPageView}
          icon="bi bi-table me-2"
          text="Samples"
          isDirty={samplesIsDirty}
          bold={pageView === 'samples' ? ' fw-normal' : ' fw-light'}
          color={pageView === 'samples' ? ' text-dark' : ' text-muted'}
        />
      </div>
      <div
        className={
          pageView === 'subsamples' ? 'border-0 px-1 h-100 align-middle text-muted bg-white shadow-sm' : 'px-1 h-100'
        }
      >
        <ViewButton
          view="subsamples"
          setPageView={setPageView}
          icon="bi bi-grid-3x3-gap-fill me-2"
          text="Subsamples"
          isDirty={subsamplesIsDirty}
          bold={pageView === 'subsamples' ? ' fw-normal' : ' fw-light'}
          color={pageView === 'subsamples' ? ' text-dark' : ' text-muted'}
        />
      </div>
      <div className={pageView === 'config' ? 'border-0 px-1 h-100 text-muted bg-white shadow-sm' : 'px-1 h-100'}>
        <ViewButton
          view="config"
          setPageView={setPageView}
          icon="bi bi-filetype-yml me-2"
          text="Config"
          isDirty={configIsDirty}
          bold={pageView === 'config' ? ' fw-normal' : ' fw-light'}
          color={pageView === 'config' ? ' text-dark' : ' text-muted'}
        />
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
