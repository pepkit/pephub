import { ErrorMessage } from '@hookform/error-message';
import { useEffect, useRef } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useSession } from '../../contexts/session-context';
import { useUploadSchemaFile } from '../../hooks/mutations/useUploadSchemaFile';
import { GitHubAvatar } from '../badges/github-avatar';
import { FileDropZone } from './components/file-dropzone';

type FromFileInputs = {
  isPrivate: boolean;
  namespace: string;
  name: string;
  description: string;
  file: File;
};

type Props = {
  onSubmit: () => void;
  onCancel: () => void;
  defaultNamespace?: string;
};

type CombinedErrorMessageProps = {
  errors: FieldErrors<FromFileInputs>;
};

const CombinedErrorMessage = (props: CombinedErrorMessageProps) => {
  const { errors } = props;
  const nameError = errors.name?.message;
  let msg = null;

  if (nameError == 'empty') {
    msg = 'Schema Name must not be empty.';
  } else if (nameError == 'invalid') {
    msg = "Schema Name must contain only alphanumeric characters, '.', '-', or '_'.";
  }

  if (nameError) {
    return <p className="text-danger text-xs pt-1 mb-0">{msg}</p>;
  }

  return null;
};

export const SchemaUploadForm = (props: Props) => {
  const { defaultNamespace, onCancel, onSubmit } = props;

  // get user info
  const { user } = useSession();

  // instantiate form
  const {
    reset: resetForm,
    register,
    control,
    watch,
    formState: { isValid, errors },
  } = useForm<FromFileInputs>({
    mode: 'onChange',
    defaultValues: {
      isPrivate: false,
      namespace: defaultNamespace || user?.login || '',
    },
  });

  const uploadFile = watch('file');
  const namespace = watch('namespace');
  const schemaName = watch('name');
  const description = watch('description');
  const isPrivate = watch('isPrivate');

  const fileDialogRef = useRef<() => void | null>(null);

  const { isPending: isUploading, upload } = useUploadSchemaFile();

  return (
    <form id="upload-form" className="border-0 form-control p-0">
      {/* <div className="mb-3 mt-3 form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="is-private-toggle"
          {...register('isPrivate')}
        />
        <label className="form-check-label">
          <i className="bi bi-lock"></i>
          Private
        </label>
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
      <CombinedErrorMessage errors={errors} />
      <label className="fw-semibold text-sm mt-2">Description</label>
      <textarea
        id="description"
        className="form-control"
        rows={3}
        placeholder="Describe your schema."
        {...register('description')}
      ></textarea>
      <label className="fw-semibold text-sm mt-2">Schema Upload</label>
      {uploadFile ? (
        <div className="dashed-border p-5 border border-2 d-flex flex-column align-items-center justify-content-center rounded-3">
          <div className="d-flex flex-column align-items-center">
            <div className="flex-row d-flex align-items-center">
              <i className="bi bi-file-earmark-text me-1"></i>
              <span className="text-secondary">{uploadFile.name}</span>
              <button
                onClick={() => {
                  resetForm({ file: undefined });
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
      <p className='text-xs mt-1'>
        * Namespace and Schema Name are required.
      </p>
      <div className="mt-2">
        <button
          onClick={() => {
            upload(
              {
                namespace,
                name: schemaName,
                description,
                isPrivate,
                schema: uploadFile,
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
