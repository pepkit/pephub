import { SubmitHandler, useForm } from 'react-hook-form';
import { useSession } from '../../hooks/useSession';
import { FileDropZone } from './components/file-dropzone';
import { useRef } from 'react';
import { popFileFromFileList } from '../../utils/dragndrop';
import { submitProjectFiles } from '../../api/namespace';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage } from '@hookform/error-message';
import { toast } from 'react-hot-toast';

interface FromFileInputs {
  is_private: boolean;
  namespace: string;
  project_name: string;
  tag: string;
  description: string;
  files: FileList;
}

export const ProjectUploadForm = () => {
  // get user info
  const { user, jwt } = useSession();

  // instantiate form
  const {
    reset: resetForm,
    register,
    handleSubmit,
    control,
    watch,
    formState: { isValid, errors },
  } = useForm<FromFileInputs>();

  const uploadFiles = watch('files');
  const namespaceToUpload = watch('namespace');
  const fileDialogRef = useRef<() => void | null>(null);

  // instantiate query client
  const queryClient = useQueryClient();

  // function to handle submitting a project
  const onSubmit: SubmitHandler<FromFileInputs> = (data) => {
    return submitProjectFiles(
      {
        namespace: data.namespace,
        project_name: data.project_name,
        tag: data.tag,
        is_private: data.is_private,
        description: data.description,
        files: data.files,
      },
      jwt || '',
    );
  };

  const mutation = useMutation({
    mutationFn: () => handleSubmit(onSubmit)(),
    onSuccess: () => {
      queryClient.invalidateQueries([namespaceToUpload]);
      toast.success('Project successully uploaded!');
    },
    onError: (err) => {
      toast.error(`Error uploading project! ${err}`);
    },
  });

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
          // dont allow any whitespace
          {...register('project_name', {
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
      <ErrorMessage errors={errors} name="project_name" render={({ message }) => <p>{message}</p>} />
      <textarea
        id="description"
        className="form-control mt-3"
        rows={3}
        placeholder="Describe your PEP."
        {...register('description')}
      ></textarea>
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
                    className="py-0 btn btn-link text-danger"
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
