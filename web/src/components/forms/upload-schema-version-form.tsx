import { ErrorMessage } from '@hookform/error-message';
import { useEffect, useRef } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useSession } from '../../contexts/session-context';
import { useUploadSchemaVersionFile } from '../../hooks/mutations/useUploadSchemaVersionFile';
import { GitHubAvatar } from '../badges/github-avatar';
import { FileDropZone } from './components/file-dropzone';
import { CombinedErrorMessage } from './components/combined-error-message'
import { KeyValueInput } from './components/key-value-input';
import { isSemanticVersion, incrementMinorVersion } from '../../utils/versions';

import { useSchemaVersionNumber } from '../../hooks/stores/useSchemaVersionNumber';

type FormFields = {
  file: File | undefined;
  tags: Record<string, string>;
  version: string;
  release_notes: string;
  contributors: string;
};

type Props = {
  onSubmit: () => void;
  onCancel: () => void;
  namespace: string;
  name: string;
  tags: Record<string, string>;
  contributors: string;
  refetchSchemaVersions: () => void;
};

export const UploadSchemaVersionForm = (props: Props) => {
  const { namespace, name, tags: oldTags, contributors, refetchSchemaVersions, onCancel, onSubmit } = props;

  const { schemaVersionNumber, setSchemaVersionNumber } = useSchemaVersionNumber();

  // Set up form methods
  const formMethods = useForm<FormFields>({
    mode: 'onChange',
    defaultValues: {
      version: incrementMinorVersion(schemaVersionNumber || ''),
      release_notes: '',
      contributors: contributors,
      tags: oldTags,
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

  const { isPending: isUploading, upload } = useUploadSchemaVersionFile(namespace, name);

  return (
    <form id="upload-form" className="border-0 form-control p-0">

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

      <label className="fw-semibold text-sm mt-2">Version Upload</label>
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

      <div className="mt-4">
        <button
          onClick={() => {
            const formValues = getValues();

            upload(
              {
                schemaFile: uploadFile,
                tags: formValues.tags,
                version: formValues.version,
                release_notes: formValues.release_notes,
                contributors: formValues.contributors
              },
              {
                onSuccess: () => {
                  resetForm();
                  onSubmit();
                  refetchSchemaVersions();
                  setSchemaVersionNumber(formValues.version);
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
