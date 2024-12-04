import { ErrorMessage } from '@hookform/error-message';
import { useRef } from 'react';
import { Controller, FieldErrors, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useSession } from '../../contexts/session-context';
import { useUploadMutation } from '../../hooks/mutations/useUploadMutation';
import { popFileFromFileList } from '../../utils/dragndrop';
import { GitHubAvatar } from '../badges/github-avatar';
import { CombinedErrorMessage } from './components/combined-error-message';
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
    <form id="new-project-form" className="border-0 form-control p-0">
      <div className="mt-3 form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="is-private-toggle"
          {...register('is_private')}
        />
        <label className="form-check-label text-sm">
          <i className="bi bi-lock"></i>
          Private
        </label>
      </div>
      <div className="namespace-name-tag-container mt-2">
        <label className="fw-semibold text-sm">Namespace*</label>
        <label className="fw-semibold text-sm">Name*</label>
        <label className="fw-semibold text-sm">Tag</label>
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
              required: {
                value: true,
                message: 'empty',
              },
              pattern: {
                value: /^[a-zA-Z0-9_-]+$/,
                message: 'invalid',
              },
            })}
          />
          <span className="mx-1 mb-1">:</span>
        </div>
        <div className="d-flex flex-row align-items-center justify-content-between w-full ">
          <input
            {...register('tag', {
              required: false,
              pattern: {
                value: /^[a-zA-Z0-9_-]+$/,
                message: 'invalid',
              },
            })}
            id="tag"
            type="text"
            className="form-control"
            placeholder="default"
          />
        </div>
      </div>
      <CombinedErrorMessage errors={errors} formType={'project'} />
      <label className="fw-semibold text-sm mt-2">Description</label>
      <textarea
        id="description"
        className="form-control"
        rows={3}
        placeholder="Describe your PEP."
        {...register('description')}
      ></textarea>
      <label className="fw-semibold text-sm mt-2">Schema</label>
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
              showDownload={false}
            />
          )}
        />
      </div>
      <label className="fw-semibold text-sm mt-2">PEP Upload</label>
      {uploadFiles ? (
        <div className="dashed-border p-5 order border-2 d-flex flex-column align-items-center justify-content-center rounded-3">
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
      <p className="text-xs mt-1">
        * Namespace and Project Name are required. A tag value of "default" will be supplied if the Tag input is left
        empty.
      </p>
      <div className="mt-3">
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
                pepSchema: pepSchema || 'databio/pep-2.1.0',
              },
              {
                onSuccess: () => {
                  resetForm({}, { keepValues: false });
                  onHide();
                },
              },
            );
          }}
          disabled={!isValid || isUploading || pepSchema === undefined}
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
            onHide();
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
