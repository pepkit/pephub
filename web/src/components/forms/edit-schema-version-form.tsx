import { Editor } from '@monaco-editor/react';
import { Controller, FormProvider, useForm } from 'react-hook-form';

import { useSession } from '../../contexts/session-context';
import { useEditSchemaVersionMutation } from '../../hooks/mutations/useEditSchemaVersionMutation';
import { CombinedErrorMessage } from './components/combined-error-message';
import { KeyValueInput } from './components/key-value-input';
import { isSemanticVersion, incrementMinorVersion } from '../../utils/versions';

import { useSchemaVersionNumber } from '../../hooks/stores/useSchemaVersionNumber';

// Props type definition
type Props = {
  namespace: string;
  name: string;
  contributors: string;
  releaseNotes: string;
  refetchSchemaVersions: () => void;
  editorHeight?: string;
  onCancel: () => void;
  onSubmit: () => void;
};

// Form fields type definition
type FormFields = {
  schemaJson: object | undefined;
  version: string;
  release_notes: string | undefined;
  contributors: string | undefined;
};

export const EditSchemaVersionForm = (props: Props) => {
  const { onCancel, onSubmit, editorHeight, namespace, name, contributors, releaseNotes, refetchSchemaVersions } = props;
  const { user } = useSession();
  
  const { schemaVersionNumber, setSchemaVersionNumber } = useSchemaVersionNumber();

  // Set up form methods
  const formMethods = useForm<FormFields>({
    mode: 'onChange',
    defaultValues: {
      version: schemaVersionNumber,
      release_notes: releaseNotes,
      contributors: contributors,
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

  const { isPending: isSubmitting, submit } = useEditSchemaVersionMutation(namespace, name);

  const handleSubmit = () => {
    const formValues = getValues();
    
    submit(
      {
        schemaJson: undefined,
        contributors: formValues.contributors,
        version: formValues.version,
        release_notes: formValues.release_notes
      },
      {
        onSuccess: () => {
          reset({ contributors: formValues.contributors, release_notes: formValues.release_notes }, { 
            keepDirty: false,
            keepValues: false 
          });
          onSubmit();
          refetchSchemaVersions();
        },
      }
    );
  };

  return (
    <FormProvider {...formMethods}>
      <form>
        <div className="namespace-name-tag-container mt-3 gap-1">
          <label className="fw-semibold text-sm">Schema Version</label>
          <label className="fw-semibold text-sm">Version Contributors</label>
        </div>

        <div className="namespace-name-tag-container fs-4 d-flex gap-1">
          <div className="d-flex flex-row align-items-center justify-content-between w-25">
          <input
              {...register('version', {
                required: {
                  value: true,
                  message: "empty",
                },
              })}
              id="version"
              type="text"
              className="form-control"
              placeholder="version"
              readOnly={true}
            />
          </div>
          <div className="d-flex flex-row align-items-center justify-content-between w-75">
          <input
            {...register('contributors')}
            id="contributors"
            type="text"
            className="form-control"
            placeholder="Contributors"
          />
          </div>
        </div>

        <label className="fw-semibold text-sm mt-2">Version Release Notes</label>
        <textarea
          {...register('release_notes')}
          id="release_notes"
          className="form-control"
          placeholder="Release notes"
        />

        <div className="mt-4 d-flex flex-row align-items-center justify-content-between">
          <p className='text-xs mt-auto mb-0'></p>
          <div>
            <button
              disabled={isSubmitting || !isValid}
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
