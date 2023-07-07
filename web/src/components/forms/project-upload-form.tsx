import { ErrorMessage } from '@hookform/error-message';
import { useQueryClient } from '@tanstack/react-query';
import { FC, useRef } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import { useUploadMutation } from '../../hooks/mutations/useUploadMutation';
import { useSession } from '../../hooks/useSession';
import { popFileFromFileList } from '../../utils/dragndrop';
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
}

export const ProjectUploadForm: FC<Props> = ({ onHide }) => {
  // get user info
  const { user, jwt } = useSession();

  // instantiate form
  const {
    reset: resetForm,
    register,
    control,
    watch,
    setValue,
    formState: { isValid, errors },
  } = useForm<FromFileInputs>({
    defaultValues: {
      is_private: false,
      pep_schema: 'pep/2.1.0',
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

  const onSuccess = () => {
    resetForm({}, { keepValues: false });
    onHide();
  };

  const mutation = useUploadMutation(
    namespace,
    projectName,
    tag,
    isPrivate,
    description,
    uploadFiles,
    pepSchema,
    jwt || '',
    onSuccess,
  );

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
      <span className="fs-4 d-flex align-items-center">
        <select
          id="namespace-select"
          className="form-select w-75"
          aria-label="Namespace selection"
          {...register('namespace', { required: true })}
        >
          <option value={user?.login}>{user?.login}</option>
          {user?.orgs.map((org) => (
            <option key={org} value={org}>
              {org}
            </option>
          ))}
        </select>
        <span className="mx-1 mb-1">/</span>
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
        <input id="tag" type="text" className="form-control" placeholder="default" {...register('tag')} />
      </span>
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
          render={({ field: { onChange, value } }) => (
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
          onClick={() => mutation.mutate()}
          disabled={!isValid}
          type="button"
          id="new-project-submit-btn"
          className="btn btn-success me-1"
        >
          <i className="bi bi-plus-circle me-1"></i>
          {mutation.isLoading ? 'Submitting...' : 'Submit'}
        </button>
        <button type="button" className="btn btn-outline-dark me-1" data-bs-dismiss="modal" onClick={() => resetForm()}>
          Cancel
        </button>
      </div>
    </form>
  );
};
