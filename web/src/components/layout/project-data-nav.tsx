import { FC } from 'react';

type ProjectView = 'samples' | 'subsamples' | 'config';

interface NavProps {
  projectView: string;
  setProjectView: (view: ProjectView) => void;
  samplesIsDirty: boolean;
  subsamplesIsDirty: boolean;
  configIsDirty: boolean;
}

interface ViewButtonProps {
  view: ProjectView;
  setProjectView: (view: ProjectView) => void;
  icon: string;
  text: string;
  isDirty: boolean;
}

const ViewButton: FC<ViewButtonProps> = ({ view, setProjectView, icon, text, isDirty }) => (
  <div>
    <button onClick={() => setProjectView(view)} className="border-0 bg-transparent mr-4">
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
  projectView,
  setProjectView,
  samplesIsDirty,
  subsamplesIsDirty,
  configIsDirty,
}) => {
  return (
    <div className="d-flex flex-row align-items-center">
      <div
        className={
          projectView === 'samples'
            ? 'border border-grey border-bottom-0 rounded-top shadow bg-solid px-1 py-2 text-muted'
            : 'px-2 py-1'
        }
      >
        <ViewButton
          view="samples"
          setProjectView={setProjectView}
          icon="bi bi-table me-2 text-muted"
          text="Samples"
          isDirty={samplesIsDirty}
        />
      </div>
      <div
        className={
          projectView === 'subsamples'
            ? 'border border-grey border-bottom-0 rounded-top shadow bg-solid px-1 py-2' 
            : 'px-2 py-1'
        }
      >
        <ViewButton
          view="subsamples"
          setProjectView={setProjectView}
          icon="bi bi-grid-3x3-gap-fill me-2 text-muted"
          text="Subsamples"
          isDirty={subsamplesIsDirty}
        />
      </div>
      <div
        className={
          projectView === 'config' ? 'border border-grey border-bottom-0 rounded-top shadow bg-solid px-1 py-2' : 'px-2 py-1'
        }
      >
        <ViewButton
          view="config"
          setProjectView={setProjectView}
          icon="bi bi-filetype-yml me-2 text-muted"
          text="Config"
          isDirty={configIsDirty}
        />
      </div>
    </div>
  );
};
