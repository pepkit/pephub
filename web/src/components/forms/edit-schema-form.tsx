import { Editor } from '@monaco-editor/react';
import { Controller, FormProvider, useForm } from 'react-hook-form';

import { useSession } from '../../contexts/session-context';
import { useEditSchemaMutation } from '../../hooks/mutations/useEditSchemaMutation';
import { CombinedErrorMessage } from './components/combined-error-message';
import { KeyValueInput } from './components/key-value-input';

// Props type definition
type Props = {
  namespace: string;
  name: string;
  description: string;
  maintainers: string;
  lifecycleStage: string;
  editorHeight?: string;
  isPrivate: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

// Form fields type definition
type FormFields = {
  isPrivate: boolean;
  namespace: string;
  name: string;
  description: string;
  maintainers: string;
  lifecycleStage: string;
};

export const EditSchemaForm = (props: Props) => {
  const { onCancel, onSubmit, editorHeight, namespace, name, description, maintainers, lifecycleStage, isPrivate } = props;
  const { user } = useSession();
  
  // Set up form methods
  const formMethods = useForm<FormFields>({
    mode: 'onChange',
    defaultValues: {
      namespace:  namespace,
      name: name,
      description: description,
      maintainers: maintainers, 
      lifecycleStage: lifecycleStage,
      isPrivate: isPrivate,
    },
  });
  
  const { 
    watch, 
    register, 
    control, 
    reset,
    setValue,
    formState: { isValid, isDirty, errors },
    getValues,
  } = formMethods;

  const { isPending: isSubmitting, update } = useEditSchemaMutation(namespace, name);

  const handleSubmit = () => {
    const formValues = getValues();
    
    update(
      {
        maintainers: formValues.maintainers,
        lifecycleStage: formValues.lifecycleStage,
        description: formValues.description,
        isPrivate: formValues.isPrivate
      },
      {
        onSuccess: () => {
          reset();
          onSubmit();
        },
      }
    );
  };

  return (
    <FormProvider {...formMethods}>
      <form>
        <div className="mt-3 form-check form-switch">
          <label className="form-check-label" htmlFor="is-private-toggle">
            Private
          </label>
          <input
            {...register('isPrivate')}
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="is-private-toggle"
          />
        </div>
        
        <label className="fw-semibold text-sm mt-2">Description</label>
        <textarea
          {...register('description')}
          id="schema-description"
          className="form-control"
          placeholder="Schema description"
        />
        
        <label className="fw-semibold text-sm mt-2">Lifecycle Stage</label>
        <input
          {...register('lifecycleStage')}
          id="lifecycle_stage"
          type="text"
          className="form-control"
          placeholder="Lifecycle stage"
        />

        <label className="fw-semibold text-sm mt-2">Maintainers</label>
        <input
          {...register('maintainers')}
          id="maintainers"
          type="text"
          className="form-control"
          placeholder="Maintainers"
        />

        <div className="mt-4 d-flex flex-row align-items-center justify-content-between">
          <p className='text-xs mt-auto mb-0'>
          </p>
          <div>
            <button
              disabled={isSubmitting || !isDirty || !isValid}
              type="button"
              className="btn btn-success float-end"
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              className="btn btn-outline-dark me-1 float-end"
              onClick={() => {
                reset();
                onCancel();
              }}
              type="reset"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
