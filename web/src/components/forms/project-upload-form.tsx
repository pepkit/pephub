import { useCallback, useRef } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { useSession } from '../../hooks/useSession';
import { popFileFromFileList } from '../../utils/dragndrop';
import { FileDropZone } from './components/file-dropzone';

interface FromFileInputs {
  is_private: boolean;
  namespace: string;
  project_name: string;
  tag: string;
  description: string;
  files: FileList;
}

export const ProjectUploadForm = () => {
  // get user innfo
  const { user } = useSession();

  // instantiate form
  const {
    reset: resetForm,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isValid },
  } = useForm<FromFileInputs>();

  const uploadFiles = watch('files');

  const { ref: fileInputFormRef, ...fileInputProps } = register('files', { required: true });

  const onSubmit: SubmitHandler<FromFileInputs> = (data) => alert(JSON.stringify(data, null, 2));

  return (
    <form id="new-project-form" className="border-0 form-control" onSubmit={handleSubmit(onSubmit)}>
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
          {...register('project_name', { required: true })}
        />
        <span className="mx-1 mb-1">:</span>
        <input id="tag" type="text" className="form-control" placeholder="default" {...register('tag')} />
      </span>
      <textarea
        id="description"
        className="form-control mt-3"
        rows={3}
        placeholder="Describe your PEP."
        {...register('description')}
      ></textarea>
      <FileDropZone
        files={uploadFiles}
        setFiles={(files: FileList) => setValue('files', files)}
        fileInputProps={fileInputProps}
        ref={fileInputFormRef}
        reset={() => resetForm({ files: undefined })}
      />
      <div className="mt-2">
        <button disabled={!isValid} type="submit" id="new-project-submit-btn" className="btn btn-success me-1">
          <i className="bi bi-plus-circle me-1"></i>
          Add
        </button>
        <button type="button" className="btn btn-outline-dark me-1" data-bs-dismiss="modal" onClick={() => resetForm()}>
          Cancel
        </button>
      </div>
    </form>
  );
};
