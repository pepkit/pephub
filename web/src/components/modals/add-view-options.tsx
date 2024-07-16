import { FC } from 'react';
import { Modal, Tab, Tabs } from 'react-bootstrap';
import ReactSelect from 'react-select';

import { useViewMutations } from '../../hooks/mutations/useViewMutations';
import { useProjectPage } from '../../contexts/project-page-context';
import { CreateProjectViewRequest } from '../../api/project';
import { useProjectViews } from '../../hooks/queries/useProjectViews';
import { useProjectSelectedView } from '../../hooks/stores/useProjectSelectedViewStore';

interface Props {
  show: boolean;
  onHide: () => void;
}

export const ViewOptionsModal: FC<Props> = ({ show, onHide }) => {

  const { namespace, projectName, tag } = useProjectPage();
  const { view, setView } = useProjectSelectedView();

  const projectViewsQuery = useProjectViews(namespace, projectName, tag);
  
  const projectViewsIsLoading = projectViewsQuery.isLoading;
  const projectViews = projectViewsQuery.data;

  const viewMutations = useViewMutations(namespace, projectName, tag);

  const runValidation = () => {
    projectViewsQuery.refetch();
  };

  const handleAddView = () => {
    const createViewRequest: CreateProjectViewRequest = {
      viewName: "test_view", // Get this from a state or input field
      sampleNames: ["young_hsc_rep1"], // Get this from state or input fields
      description: "test_description", // Optional
      noFail: false // Optional
    };

    viewMutations.addViewMutation.mutate(createViewRequest);
    // runValidation();
  };

  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Manage Views</h1>
      </Modal.Header>
      <Modal.Body>
        <div className="">
          <h6 className="mb-1">Save View</h6>
          <p className="mb-3 text-xs">Save the current project sample table state as a view by naming it and clicking the save button.</p>
          <input
            placeholder="View name..."
            type="text"
            className="form-control"
            id="view-name"
            aria-describedby="view-name-help"
          />
          <button 
            // disabled={
            //   configMutation.isPending ||
            //   totalProjectMutation.isPending ||
            //   !(configIsDirty || samplesIsDirty || subsamplesIsDirty) ||
            //   !shouldFetchSampleTable ||
            //   !!view
            // }
            onClick={handleAddView}
            className="btn btn-success px-2 mt-3 text-xs">
            <i className="bi bi-plus-lg"></i> Save New View
          </button>
        </div>
        <hr />
        <div className="">
          <h6 className="mb-1">Remove View</h6>
          <p className="mb-3 text-xs">Remove an existing view by selecting it and clicking the remove button.</p>
          <ReactSelect
            styles={{
              control: (provided) => ({
                ...provided,
                borderRadius: '0.333333em', // Left radii set to 0, right radii kept at 4px
              }),
            }}
            className="top-z w-100 ms-auto"
            options={
              projectViews?.views.map((view) => ({
                view: view.name,
                description: view.description || 'No description',
                value: view.name,
                label: `${view.name} | ${view.description || 'No description'}`,
              })) || []
            }
            // onChange={(selectedOption) => {
            //   debugger;
            //   if (selectedOption === null) {
            //     setView(undefined);
            //     searchParams.delete('view');
            //     setSearchParams(searchParams);
            //   } else {
            //     setView(selectedOption.value);
            //     searchParams.set('view', selectedOption.value);
            //     setSearchParams(searchParams);
            //   }
            // }}
            // isDisabled={projectViews?.views.length === 0 || projectViewsIsLoading}
            // isClearable
            // placeholder={
            //   projectViewsIsLoading
            //     ? 'Loading views...'
            //     : projectViews?.views.length === 0
            //     ? 'No views available'
            //     : 'Select a view'
            // }
            // value={view === undefined ? null : { view: view, description: view, value: view, label: view }}
          />
          <button className="btn btn-danger px-2 mt-3 text-xs">
            <i className="bi bi-trash"></i> Remove View
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
