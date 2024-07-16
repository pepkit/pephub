import { Fragment, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip, { TooltipProps } from 'react-bootstrap/Tooltip';
import { useSearchParams } from 'react-router-dom';
import ReactSelect from 'react-select';

import { useProjectPage } from '../../contexts/project-page-context';
import { ViewOptionsModal } from '../../components/modals/add-view-options';
import { useProjectViews } from '../../hooks/queries/useProjectViews';
import { useProjectSelectedView } from '../../hooks/stores/useProjectSelectedViewStore';

type ViewSelectorProps = {};

export const ViewSelector = (props: ViewSelectorProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const { namespace, projectName, tag } = useProjectPage();
  const { view, setView } = useProjectSelectedView();

  const projectViewsQuery = useProjectViews(namespace, projectName, tag);
  
  const projectViewsIsLoading = projectViewsQuery.isLoading;
  const projectViews = projectViewsQuery.data;

  const [showViewOptionsModal, setShowViewOptionsModal] = useState(false);

  const renderTooltip = (props: TooltipProps) => (
    <Tooltip id="button-tooltip" {...props}>
      A project view is a way to subset your sample table in a way that is more manageable for viewing in the browser.
      To learn more about vierws, and how to create them, visit the{' '}
      <a href="https://pep.databio.org/pephub/">API documentation.</a>
    </Tooltip>
  );

  return (
    <Fragment>
      <div className="ps-3 d-flex flex-row align-items-center justify-content-end w-25">
        <button
          onClick={() => setShowViewOptionsModal(true)}
          className="btn btn-secondary rounded-end-0 rounded-start-1 ps-2 pe-2"
        >
          <i className="bi bi-gear-wide-connected"></i>
        </button>
        <ReactSelect
          styles={{
            control: (provided) => ({
              ...provided,
              borderRadius: '0 .25em .25em 0', // Left radii set to 0, right radii kept at 4px
            }),
          }}
          className="top-z w-100"
          options={
            projectViews?.views.map((view) => ({
              view: view.name,
              description: view.description || 'No description',
              value: view.name,
              label: `${view.name} | ${view.description || 'No description'}`,
            })) || []
          }
          onChange={(selectedOption) => {
            if (selectedOption === null) {
              setView(undefined);
              searchParams.delete('view');
              setSearchParams(searchParams);
            } else {
              setView(selectedOption.value);
              searchParams.set('view', selectedOption.value);
              setSearchParams(searchParams);
            }
          }}
          isDisabled={projectViews?.views.length === 0 || projectViewsIsLoading}
          isClearable
          placeholder={
            projectViewsIsLoading
              ? 'Loading views...'
              : projectViews?.views.length === 0
              ? 'No views available'
              : 'Select a view'
          }
          value={view === undefined ? null : { view: view, description: view, value: view, label: view }}
        />
        <OverlayTrigger placement="right" delay={{ show: 250, hide: 2000 }} overlay={renderTooltip}>
          <i className="bi bi-info-circle ms-2"></i>
        </OverlayTrigger>
      </div>
      {/*<ViewOptionsModal show={showViewOptionsModal} onHide={() => setShowViewOptionsModal(false)} />*/}
    </Fragment>
  );
};
