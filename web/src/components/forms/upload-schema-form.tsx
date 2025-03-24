import { ErrorMessage } from '@hookform/error-message';
import { useEffect, useRef } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useSession } from '../../contexts/session-context';
import { useUploadSchemaFile } from '../../hooks/mutations/useUploadSchemaFile';
import { GitHubAvatar } from '../badges/github-avatar';
import { FileDropZone } from './components/file-dropzone';
import { CombinedErrorMessage } from './components/combined-error-message'
import { KeyValueInput } from './components/key-value-input';

type FormFields = {
  isPrivate: boolean;
  namespace: string;
  name: string;
  description: string;
  file: File | undefined;
  tags: Record<string, string>;
  maintainers: string;
  version: string;
  release_notes: string;
  lifecycle_stage: string;
  contributors: string;
};

type Props = {
  onSubmit: () => void;
  onCancel: () => void;
  defaultNamespace?: string;
};

export const SchemaUploadForm = (props: Props) => {
  const { defaultNamespace, onCancel, onSubmit } = props;
  const { user } = useSession();

  // Set up form methods
  const formMethods = useForm<FormFields>({
    mode: 'onChange',
    defaultValues: {
      namespace: defaultNamespace || user?.login || '',
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
    reset: resetForm,
    setValue,
    formState: { isValid, isDirty, errors },
    getValues,
  } = formMethods;

  const uploadFile = watch('file');
  const namespace = watch('namespace');
  const schemaName = watch('name');
  const description = watch('description');
  const isPrivate = watch('isPrivate');

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

  const fileDialogRef = useRef<() => void | null>(null);

  const { isPending: isUploading, upload } = useUploadSchemaFile();

  return (
    <form id="upload-form" className="border-0 form-control p-0">
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
            id="namespace-select"
            className="form-select"
            aria-label="Namespace selection"
            {...register('namespace', { required: true })}
          >
            <option value={user?.login}>{user?.login}</option>
            {user?.orgs.map((org) => (
              <option key={org} value={org}>
                <GitHubAvatar namespace={org} height={20} width={20} />
                {org}
              </option>
            ))}
          </select>
          <span className="mx-1 mb-1">/</span>
        </div>
        <div className="d-flex flex-row align-items-center justify-content-between w-75">
          <input
            id="project-name"
            type="text"
            className="form-control"
            placeholder="name"
            // dont allow any whitespace
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

      <label className="fw-semibold text-sm mt-2">Schema Upload</label>
      {uploadFile ? (
        <div className="dashed-border p-5 border border-2 d-flex flex-column align-items-center justify-content-center rounded-3">
          <div className="d-flex flex-column align-items-center">
            <div className="flex-row d-flex align-items-center">
              <i className="bi bi-file-earmark-text me-1"></i>
              <span className="text-secondary">{uploadFile.name}</span>
              <button
                onClick={() => {
                  setValue('file', undefined, { shouldDirty: true });
                  fileDialogRef.current?.();
                }}
                className="py-0 btn btn-link text-danger shadow-none"
              >
                <i className="bi bi-x-circle"></i>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <FileDropZone name="file" control={control} multiple={false} innerRef={fileDialogRef} />
      )}

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
                // validate: {
                //   isValidSemver: (value) => isSemanticVersion(value) || "Please enter a valid semantic version (e.g., 0.1.0)"
                // }
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

      <p className='text-xs mt-1'>
        * Namespace and Schema Name are required.
      </p>
      <div className="mt-2">
        <button
          onClick={() => {
            const formValues = getValues();

            upload(
              {
                namespace,
                name: formValues.name,
                description: formValues.description,
                isPrivate: formValues.isPrivate,
                schemaFile: uploadFile,
                tags: formValues.tags,
                maintainers: formValues.maintainers,
                version: formValues.version,
                release_notes: formValues.release_notes,
                lifecycle_stage: formValues.lifecycle_stage,
                contributors: formValues.contributors
              },
              {
                onSuccess: () => {
                  resetForm();
                  onSubmit();
                },
              },
            );
          }}
          disabled={!isValid || isUploading}
          type="button"
          id="new-project-submit-btn"
          className="btn btn-success float-end"
        >
          <i className="bi bi-plus-circle me-1"></i>
          {isUploading ? 'Submitting...' : 'Submit'}
        </button>
        <button
          type="button"
          className="btn btn-outline-dark me-1 float-end"
          data-bs-dismiss="modal"
          onClick={() => {
            resetForm();
            onCancel();
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
