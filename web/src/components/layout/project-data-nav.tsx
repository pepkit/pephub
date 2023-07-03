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
    <button onClick={() => setProjectView(view)} className="border-0 bg-transparent project-button-toggles rounded">
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
            ? 'border-primary border-bottom bg-transparent px-2 py-1'
            : 'border-bottom px-2 py-1'
        }
      >
        <ViewButton
          view="samples"
          setProjectView={setProjectView}
          icon="bi bi-table me-1"
          text="Samples"
          isDirty={samplesIsDirty}
        />
      </div>
      <div
        className={
          projectView === 'subsamples'
            ? 'border-primary border-bottom bg-transparent px-2 py-1'
            : 'border-bottom px-2 py-1'
        }
      >
        <ViewButton
          view="subsamples"
          setProjectView={setProjectView}
          icon="bi bi-grid-3x3-gap-fill me-1"
          text="Subsamples"
          isDirty={subsamplesIsDirty}
        />
      </div>
      <div
        className={
          projectView === 'config' ? 'border-primary border-bottom bg-transparent px-2 py-1' : 'border-bottom px-2 py-1'
        }
      >
        <ViewButton
          view="config"
          setProjectView={setProjectView}
          icon="bi bi-filetype-yml me-1"
          text="Config"
          isDirty={configIsDirty}
        />
      </div>
    </div>
  );
};