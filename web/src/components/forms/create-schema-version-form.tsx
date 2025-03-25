import { Editor } from '@monaco-editor/react';
import { Controller, FormProvider, useForm } from 'react-hook-form';

import { useSession } from '../../contexts/session-context';
import { useCreateSchemaVersionMutation } from '../../hooks/mutations/useCreateSchemaVersionMutation';
import { CombinedErrorMessage } from './components/combined-error-message';
import { KeyValueInput } from './components/key-value-input';
import { isSemanticVersion, incrementMinorVersion } from '../../utils/versions';

import { useSchemaVersionNumber } from '../../hooks/stores/useSchemaVersionNumber';

// Props type definition
type Props = {
  namespace: string;
  name: string;
  tags: Record<string, string>;
  schemaJson: object;
  contributors: string;
  refetchSchemaVersions: () => void;
  editorHeight?: string;
  onCancel: () => void;
  onSubmit: () => void;
};

// Form fields type definition
type FormFields = {
  schemaJson: object;
  tags: Record<string, string>;
  version: string;
  release_notes: string;
  contributors: string;
};

export const CreateSchemaVersionForm = (props: Props) => {
  const { onCancel, onSubmit, editorHeight, namespace, name, tags: oldTags, schemaJson, contributors, refetchSchemaVersions } = props;
  const { user } = useSession();

  const { schemaVersionNumber, setSchemaVersionNumber } = useSchemaVersionNumber();

  // Set up form methods
  const formMethods = useForm<FormFields>({
    mode: 'onChange',
    defaultValues: {
      version: incrementMinorVersion(schemaVersionNumber || ''),
      release_notes: '',
      contributors: contributors,
      tags: oldTags,
      schemaJson: schemaJson
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

  // Watch tags from the form
  const tags = watch('tags');

  // Handle adding a tag
  const handleAddTag = (key: string, value: string) => {
    const updatedTags = {
      ...tags,
      [key]: value
    };
    
    setValue('tags', updatedTags, {
      shouldDirty: true,
      shouldValidate: true
    });
  };

  // Handle removing a tag
  const handleRemoveTag = (keyToRemove: string) => {
    const { [keyToRemove]: removed, ...rest } = tags;
    
    setValue('tags', rest, {
      shouldDirty: true,
      shouldValidate: true
    });
  };

  const { isPending: isSubmitting, submit } = useCreateSchemaVersionMutation(namespace, name);

  const handleSubmit = () => {
    const formValues = getValues();
    
    submit(
      {
        schemaJson: formValues.schemaJson,
        contributors: formValues.contributors,
        tags: formValues.tags,
        version: formValues.version,
        release_notes: formValues.release_notes
      },
      {
        onSuccess: () => {
          reset();
          onSubmit();
          refetchSchemaVersions();
          setSchemaVersionNumber(formValues.version);
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
                validate: {
                  isSemantic: (value) => isSemanticVersion(value) || "Please enter a valid semantic version (e.g., 0.1.0)"
                }
              })}
              id="version"
              type="text"
              className="form-control"
              placeholder="version"
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
        {errors?.version?.message && (
           <p className="text-danger text-xs pt-1 mb-0">{errors?.version?.message}</p>
        )}

        <label className="fw-semibold text-sm mt-2">Version Release Notes</label>
        <textarea
          {...register('release_notes')}
          id="release_notes"
          className="form-control"
          placeholder="Release notes"
        />

        <label className="fw-semibold text-sm mt-2">Tags</label>
        <KeyValueInput
          tags={tags}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
        />

        <label className="fw-semibold text-sm mt-2">Contents (JSON)</label>
        <div className="border rounded py-1">
          <Controller
            name="schemaJson"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Editor
                onChange={(v) => {
                  try {
                    const jsonValue = typeof v === 'string' ? JSON.parse(v) : v;
                    onChange(jsonValue);
                  } catch (err) {
                    onChange(v);
                  }
                }}
                saveViewState
                language="json"
                defaultLanguage="json"
                value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                loading={null}
                height={editorHeight || '50vh'}
                // options={{ readOnly: true }}
              />
            )}
          />
        </div>

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
