import { ErrorMessage } from '@hookform/error-message';
import { FormEvent, useState } from 'react';
import { Modal } from 'react-bootstrap';
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
    console.log(selectedViewDelete)
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
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Manage Views</h1>
      </Modal.Header>
      <Modal.Body>
        {filteredSamples.length > 0 ? (
          <div className="">
            <h6 className="mb-1">Save View</h6>
            <p className="mb-3">
              Save the current filtered sample table state as a view by providing a name (required) and description
              (optional) for the view.
            </p>
            <form>
              <div className="pb-2">
                <label htmlFor="view-description" className="form-label fw-bold">
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
                />
              </div>
              <div className="mt-1">
                <label htmlFor="view-description" className="form-label fw-bold">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  className="form-control"
                  id="view-description"
                  aria-describedby="view-description-help"
                  placeholder="Description..."
                />
              </div>
              <ErrorMessage
                errors={errors}
                name="name"
                render={({ message }) => (message ? <p className="text-danger pt-1 mb-0">{message}</p> : null)}
              />
              <button
                disabled={
                  filteredSamples.length === 0 ||
                  !isValid ||
                  !!errors.name?.message ||
                  viewMutations.addViewMutation.isPending
                }
                type="button"
                className="btn btn-success px-2 mt-3"
                onClick={() => {
                  onSubmit();
                  resetForm();
                }}
              >
                <i className="bi bi-plus-circle me-1"></i>
                {viewMutations.addViewMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </form>
            <hr />
          </div>
        ) : null}
        <div className="">
          <h6 className="mb-1">Remove View</h6>
          <p className="mb-3">Remove an existing view by selecting it from the dropdown menu.</p>
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
          <button
            disabled={deleteState || viewMutations.removeViewMutation.isPending || selectedViewDelete === null}
            onClick={handleDeleteView}
            className="btn btn-danger px-2 mt-3"
          >
            <i className="bi bi-trash"></i> {viewMutations.removeViewMutation.isPending ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
