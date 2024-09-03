import { ErrorMessage } from '@hookform/error-message';
import { FormEvent, useState } from 'react';
import { Modal, Tab, Tabs } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import ReactSelect from 'react-select';

import { CreateProjectViewRequest } from '../../api/project';
import { useProjectPage } from '../../contexts/project-page-context';
import { useViewMutations } from '../../hooks/mutations/useViewMutations';
import { useProjectViews } from '../../hooks/queries/useProjectViews';
import { useProjectSelectedView } from '../../hooks/stores/useProjectSelectedViewStore';

type Props = {
  show: boolean;
  onHide: () => void;
  filteredSamples: string[];
  deleteView: (deletedView: string) => void;
};

type FormValues = {
  name: string;
  description: string;
};

type ViewOption = {
  view: string;
  description: string;
  value: string;
  label: string;
};

export const ViewOptionsModal = (props: Props) => {
  const { show, onHide, filteredSamples, deleteView } = props;

  const { namespace, projectName, tag } = useProjectPage();

  const projectViewsQuery = useProjectViews(namespace, projectName, tag);

  const projectViewsIsLoading = projectViewsQuery.isLoading;
  const projectViews = projectViewsQuery.data;

  const viewMutations = useViewMutations(namespace, projectName, tag);

  const [selectedViewDelete, setSelectedViewDelete] = useState<ViewOption | null>(null);
  const [deleteState, setDeleteState] = useState(true);

  const {
    watch,
    register,
    reset: resetForm,
    formState: { isValid, errors },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      name: undefined,
      description: undefined,
    },
  });

  const viewName = watch('name');
  const viewDescription = watch('description');

  const handleDeleteView = () => {
    if (selectedViewDelete === null) {
      toast.error('No view selected to delete');
      return;
    }
    viewMutations.removeViewMutation.mutate(selectedViewDelete.value);
    setSelectedViewDelete(null);
    deleteView(selectedViewDelete.value)
  };

  const onSubmit = () => {
    if (filteredSamples.length === 0) {
      toast.error('Please filter samples before saving a view.');
      return;
    }
    const createViewRequest: CreateProjectViewRequest = {
      viewName: viewName,
      sampleNames: filteredSamples, // You might want to update this based on your requirements
      description: viewDescription,
      noFail: false,
    };

    viewMutations.addViewMutation.mutate(createViewRequest, {
      onSuccess: () => {
        onHide();
      },
    });

    resetForm({}, { keepValues: false });
  };

  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide} style={{ zIndex: 99999 }}>
      <Modal.Body >
        <div className='p-1 modal-pill'>
          <h1 className="fs-5 mb-1 fw-semibold d-inline">Manage Views</h1>
          <button
            className="btn btn-outline-dark px-1 py-0 m-0 float-end d-inline rounded-3 border-0 shadow-none"
            type="button" 
            onClick={() => {
              onHide();
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
          <p className='text-sm mt-1 mb-3'>
            A project view is a way to subset your sample table in a way that is more manageable for viewing in the browser.
            To learn more about views and how to create them, visit the{' '}
            <a href="https://pep.databio.org/pephub/">API documentation</a>
            .
          </p>
          <div className="border-bottom" style={{ margin: '0 -1.25em' }}></div>
          <Tabs 
            variant="pills" 
            justify defaultActiveKey="blank" 
            id="uncontrolled-tab"
            className='border border-2 border-light-subtle rounded rounded-3 text-sm bg-body-secondary mt-3' 
           >
            <Tab
              eventKey="blank"
              title={
                <span>
                  <i className="bi bi-save me-1"></i>
                  Save View
                </span>
              }
            >
              <div 
                className="mt-3" 
                // style={{ minHeight: '360px' }}
              >
                <p className="mb-3 text-sm">
                  Save the current filtered sample table state as a view by providing a name (required) and description
                  (optional) for the view. 
                </p>
                {filteredSamples.length > 0 ? (
                  null
                ) : 
                  <p className='text-sm'>
                    <strong>Note: </strong>
                    You currently have no table filters applied. 
                    To apply one, click on the dropdown arrow next to your column header of interest, and then filter by value. 
                    To clear the current column filter, click "Select all" from the same dropdown menu.
                  </p>
                }
                <form>
                  <div className="pb-2">
                    <label htmlFor="view-description" className="form-label text-sm fw-semibold mb-1">
                      Name
                    </label>
                    <input
                      {...register('name', {
                        required: {
                          value: true,
                          message: 'View Name must not be empty.',
                        },
                        pattern: {
                          value: /^[a-zA-Z0-9_-]+$/,
                          message: "View Name must contain only alphanumeric characters, '-', or '_'.",
                        },
                      })}
                      type="text"
                      className="form-control"
                      id="view-name"
                      aria-describedby="view-name-help"
                      placeholder="Name..."
                      disabled={filteredSamples.length === 0}
                    />
                  </div>
                  <div className="mt-1">
                    <label htmlFor="view-description" className="form-label text-sm fw-semibold mb-1">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      className="form-control"
                      id="view-description"
                      aria-describedby="view-description-help"
                      placeholder="Description..."
                      disabled={filteredSamples.length === 0}
                    />
                  </div>
                  <ErrorMessage
                    errors={errors}
                    name="name"
                    render={({ message }) => (message ? <p className="text-danger pt-1 mb-0">{message}</p> : null)}
                  />
                  <div className="border-bottom mt-3" style={{ margin: '0 -1.25em' }}></div>
                  <div>
                    <button
                      disabled={
                        filteredSamples.length === 0 ||
                        !isValid ||
                        !!errors.name?.message ||
                        viewMutations.addViewMutation.isPending
                      }
                      type="button"
                      className="btn btn-success px-2 mt-3 mb-1 float-end"
                      onClick={() => {
                        onSubmit();
                        resetForm();
                      }}
                    >
                      <i className="bi bi-plus-circle me-1"></i>
                      {viewMutations.addViewMutation.isPending ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      className="btn btn-outline-dark me-1 mt-3 mb-1 float-end"
                      onClick={() => {
                        onHide();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </Tab>
            <Tab
              eventKey="from-file"
              title={
                <span className='p-3'>
                  <i className="bi bi-trash me-1"></i>
                  Remove View
                </span>
              }
            >
              <div 
                className="mt-3" 
                // style={{ minHeight: '360px' }}
              >
                <p className="mb-3 text-sm">Remove an existing view by selecting it from the dropdown menu.</p>
                <p className="form-label text-sm fw-semibold mb-1">
                Current Views
                </p>
                <ReactSelect
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      borderRadius: '0.333333em',
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
                  onChange={(selectedOption) => {
                    if (selectedOption === null || projectViews?.views.length === 0) {
                      setSelectedViewDelete(null);
                      setDeleteState(true);
                    } else {
                      setSelectedViewDelete(selectedOption);
                      setDeleteState(false);
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
                  value={
                    selectedViewDelete === null
                      ? null
                      : {
                          view: selectedViewDelete.view,
                          description: selectedViewDelete.description,
                          value: selectedViewDelete.value,
                          label: selectedViewDelete.label,
                        }
                  }
                />
                <div className="border-bottom mt-3" style={{ margin: '0 -1.25em' }}></div>
                <div>
                  <button
                    disabled={deleteState || viewMutations.removeViewMutation.isPending || selectedViewDelete === null}
                    onClick={handleDeleteView}
                    className="btn btn-danger px-2 mt-3 mb-1 float-end"
                  >
                    <i className="bi bi-trash"></i> {viewMutations.removeViewMutation.isPending ? 'Removing...' : 'Remove'}
                  </button>
                  <button
                    className="btn btn-outline-dark me-1 mt-3 mb-1 float-end"
                    onClick={() => {
                      onHide();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>
      </Modal.Body>
    </Modal>
  );
};
