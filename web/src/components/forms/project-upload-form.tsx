import { ErrorMessage } from '@hookform/error-message';
import { useRef } from 'react';
import { Controller, FieldErrors, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useSession } from '../../contexts/session-context';
import { useUploadMutation } from '../../hooks/mutations/useUploadMutation';
import { popFileFromFileList } from '../../utils/dragndrop';
import { GitHubAvatar } from '../badges/github-avatar';
import { FileDropZone } from './components/file-dropzone';
import { SchemaDropdown } from './components/schemas-databio-dropdown';

interface FromFileInputs {
  is_private: boolean;
  namespace: string;
  name: string;
  tag: string;
  description: string;
  files: FileList;
  pep_schema: string;
}

interface Props {
  onHide: () => void;
  defaultNamespace?: string;
}

type CombinedErrorMessageProps = {
  errors: FieldErrors<FromFileInputs>;
};

const CombinedErrorMessage = (props: CombinedErrorMessageProps) => {
  const { errors } = props;
  const nameError = errors.name?.message;
  const tagError = errors.tag?.message;
  let msg = null;

  if (nameError == 'empty' && !tagError) {
    msg = 'Project Name must not be empty.';
  } else if (nameError == 'invalid' && !tagError) {
    msg = "Project Name must contain only alphanumeric characters, '-', or '_'.";
  } else if (nameError == 'empty' && tagError == 'invalid') {
    msg = "Project Name must not be empty and Tag must contain only alphanumeric characters, '-', or '_'.";
  } else if (nameError == 'invalid' && tagError == 'invalid') {
    msg = "Project Name and Tag must contain only alphanumeric characters, '-', or '_'.";
  } else if (!nameError && tagError == 'invalid') {
    msg = "Project Tag must contain only alphanumeric characters, '-', or '_'.";
  }

  if (nameError || tagError) {
    return <p className="text-danger text-xs pt-1">{msg}</p>;
  }

  return null;
};

export const ProjectUploadForm = ({ onHide, defaultNamespace }: Props) => {
  // get user info
  const { user } = useSession();

  // instantiate form
  const {
    reset: resetForm,
    register,
    control,
    watch,
    setValue,
    formState: { isValid, errors },
  } = useForm<FromFileInputs>({
    mode: 'onChange',
    defaultValues: {
      is_private: false,
      pep_schema: undefined,
      namespace: defaultNamespace || user?.login || '',
    },
  });

  const uploadFiles = watch('files');
  const namespace = watch('namespace');
  const projectName = watch('name');
  const tag = watch('tag');
  const description = watch('description');
  const isPrivate = watch('is_private');
  const pepSchema = watch('pep_schema');
  const fileDialogRef = useRef<() => void | null>(null);

  const { isPending: isUploading, upload } = useUploadMutation(namespace);

  return (
    <form id="new-project-form" className="border-0 form-control">
      <div className="mb-3 mt-3 form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="is-private-toggle"
          {...register('is_private')}
        />
        <label className="form-check-label">
          <i className="bi bi-lock"></i>
          Private
        </label>
      </div>
      <div className="namespace-name-tag-container">
        <label className="fw-bold text-sm">Namespace *</label>
        <label className="fw-bold text-sm">Name *</label>
        <label className="fw-bold text-sm">Tag</label>
      </div>
      <div className="namespace-name-tag-container fs-4">
        <div className="d-flex flex-row align-items-center justify-content-between w-full ">
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
        <div className="d-flex flex-row align-items-center justify-content-between w-full ">
          <input
            id="project-name"
            type="text"
            className="form-control"
            placeholder="name"
            // dont allow any whitespace
            {...register('name', {
              required: true,
              pattern: {
                value: /^\S+$/,
                message: 'No spaces allowed.',
              },
            })}
          />
          <span className="mx-1 mb-1">:</span>
        </div>
        <div className="d-flex flex-row align-items-center justify-content-between w-full ">
          <input id="tag" type="text" className="form-control" placeholder="default" {...register('tag')} />
        </div>
      </div>
      <ErrorMessage errors={errors} name="name" render={({ message }) => <p>{message}</p>} />
      <textarea
        id="description"
        className="form-control mt-3"
        rows={3}
        placeholder="Describe your PEP."
        {...register('description')}
      ></textarea>
      <label className="form-check-label mt-3 mb-1">
        <i className="bi bi-file-earmark-break me-1"></i>
        Schema
      </label>
      <div>
        <Controller
          control={control}
          name="pep_schema"
          render={({ field: { value } }) => (
            <SchemaDropdown
              value={value}
              onChange={(schema) => {
                setValue('pep_schema', schema);
              }}
            />
          )}
        />
      </div>
      {uploadFiles ? (
        <div className="dashed-border p-5 mt-3 border border-2 d-flex flex-column align-items-center justify-content-center rounded-3">
          <div className="d-flex flex-column align-items-center">
            {Array.from(uploadFiles).map((file, i) => {
              return (
                <div key={i} className="flex-row d-flex align-items-center">
                  <i className="bi bi-file-earmark-text me-1"></i>
                  <span className="text-secondary">{file.name}</span>
                  <button
                    onClick={() => {
                      popFileFromFileList(uploadFiles, i, (newFiles) => resetForm({ files: newFiles }));
                    }}
                    className="py-0 btn btn-link text-danger shadow-none"
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                </div>
              );
            })}
            <button onClick={() => resetForm({ files: undefined })} className="mt-2 btn btn-sm btn-outline-dark">
              Clear
            </button>
          </div>
        </div>
      ) : (
        <FileDropZone name="files" control={control} multiple={true} innerRef={fileDialogRef} />
      )}
      <div className="mt-2">
        <button
          onClick={() => {
            if (projectName === '') {
              toast.error('Could not create PEP. Project Name must not be empty.');
              return;
            }
            upload(
              {
                project: projectName,
                tag,
                isPrivate,
                description,
                files: uploadFiles,
                pepSchema,
              },
              {
                onSuccess: () => {
                  resetForm({}, { keepValues: false });
                  onHide();
                },
              },
            );
          }}
          disabled={isUploading}
          type="button"
          id="new-project-submit-btn"
          className="btn btn-success me-1"
        >
          <i className="bi bi-plus-circle me-1"></i>
          {isUploading ? 'Submitting...' : 'Submit'}
        </button>
        <button
          type="button"
          className="btn btn-outline-dark me-1"
          data-bs-dismiss="modal"
          onClick={() => {
            resetForm();
            onHide();
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
