import { Editor } from '@monaco-editor/react';
import { Controller, FormProvider, useForm } from 'react-hook-form';

import { useSession } from '../../contexts/session-context';
import { useCreateSchemaMutation } from '../../hooks/mutations/useCreateSchemaMutation';
import { CombinedErrorMessage } from './components/combined-error-message';
import { KeyValueInput } from './components/key-value-input';
import { isSemanticVersion } from '../../utils/versions';

// Default schema JSON
const defaultSchemaJson = {
  "properties": {
    "samples": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "sample_name": {
            "type": "string",
            "description": "name of the sample, which is the name of the output BED file"
          },
          "genome": {
            "type": "string",
            "description": "namespace for the assets to be build",
            "pattern": "^[^/:]*$"
          }
        }
      }
    }
  },
  "required": ["samples"]
};

// Props type definition
type Props = {
  defaultNamespace?: string;
  editorHeight?: string;
  onCancel: () => void;
  onSubmit: () => void;
};

// Form fields type definition
type FormFields = {
  isPrivate: boolean;
  namespace: string;
  name: string;
  description: string;
  schemaJson: object;
  tags: Record<string, string>;
  maintainers: string;
  version: string;
  release_notes: string;
  lifecycle_stage: string;
  contributors: string;
};

export const CreateSchemaForm = (props: Props) => {
  const { onCancel, onSubmit, editorHeight, defaultNamespace } = props;
  const { user } = useSession();
  
  // Set up form methods
  const formMethods = useForm<FormFields>({
    mode: 'onChange',
    defaultValues: {
      namespace: defaultNamespace || user?.login || '',
      schemaJson: defaultSchemaJson, 
      version: '0.1.0',
      release_notes: '',
      lifecycle_stage: '',
      contributors: '',
      maintainers: user?.login || '', 
      isPrivate: false,
      tags: {}
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

  const { isPending: isSubmitting, submit } = useCreateSchemaMutation();

  const handleSubmit = () => {
    // Get all current values from the form
    const formValues = getValues();
    
    submit(
      {
        ...formValues,
        // Ensure we're getting the latest tags
        tags: formValues.tags,
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
        {/* <div className="mt-3 form-check form-switch">
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
        </div> */}
        
        <div className="namespace-name-tag-container mt-3">
          <label className="fw-semibold text-sm">Namespace*</label>
          <label className="fw-semibold text-sm">Name*</label>
        </div>
        <div className="namespace-name-tag-container fs-4 d-flex">
          <div className="d-flex flex-row align-items-center justify-content-between w-25">
            <select
              id="blank-namespace-select"
              className="form-select"
              aria-label="Namespace selection"
              {...register('namespace', { required: true })}
            >
              <option value={user?.login}>{user?.login}</option>
              {user?.orgs?.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
            <span className="mx-1 mb-1">/</span>
          </div>
          <div className="d-flex flex-row align-items-center justify-content-between w-75">
            <input
              {...register('name', {
                required: {
                  value: true,
                  message: "empty",
                },
                pattern: {
                  value: /^[a-zA-Z0-9_.-]+$/,
                  message: "invalid",
                },
              })}
              id="schema-name"
              type="text"
              className="form-control"
              placeholder="name"
            />
          </div>
        </div>
        <CombinedErrorMessage errors={errors} formType={'schema'} />
        
        <label className="fw-semibold text-sm mt-2">Description</label>
        <textarea
          {...register('description')}
          id="schema-description"
          className="form-control"
          placeholder="Schema description"
        />

        <label className="fw-semibold text-sm mt-2">Lifecycle Stage</label>
        <input
          {...register('lifecycle_stage')}
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
              />
            )}
          />
        </div>

        <div className="namespace-name-tag-container mt-2 gap-1">
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

        <div className="mt-4 d-flex flex-row align-items-center justify-content-between">
          <p className='text-xs mt-auto mb-0'>
            * Namespace and Schema Name are required.
          </p>
          <div>
            <button
              disabled={isSubmitting || !isDirty || !isValid}
              type="button"
              className="btn btn-success float-end"
              onClick={handleSubmit}
            >
              <i className="bi bi-plus-circle me-1"></i>
              {isSubmitting ? 'Creating...' : 'Create'}
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
