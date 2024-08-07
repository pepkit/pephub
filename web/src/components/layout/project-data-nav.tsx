import { OverlayTrigger, Tooltip } from 'react-bootstrap';

import { useProjectPageView } from '../../hooks/stores/useProjectPageView';
import { ViewSelector } from '../project/view-selector';

type PageView = 'samples' | 'subsamples' | 'config' | 'help';

type NavProps = {
  filteredSamples: string[];
};

type ViewButtonProps = {
  view: PageView;
  setPageView: (view: PageView) => void;
  icon: string;
  text: string;
  bold: string;
  color: string;
  isDirty: boolean;
};

const ViewButton = (props: ViewButtonProps) => {
  const { view, setPageView, icon, text, isDirty, bold, color } = props;
  return (
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
};

export const ProjectDataNav = (props: NavProps) => {
  const { filteredSamples } = props;

  const { pageView, setPageView } = useProjectPageView();

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
          isDirty={false}
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
          isDirty={false}
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
          isDirty={false}
          bold={pageView === 'config' ? ' fw-normal' : ' fw-light'}
          color={pageView === 'config' ? ' text-dark' : ' text-muted'}
        />
      </div>
      <ViewSelector filteredSamples={filteredSamples} />
    </div>
  );
};
