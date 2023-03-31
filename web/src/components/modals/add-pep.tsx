import { FC, useRef, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { Modal, Tab, Tabs } from 'react-bootstrap';
import { useSession } from '../../hooks/useSession';
import { popFileFromFileList } from '../../utils/dragndrop';

interface Props {
  show: boolean;
  onHide: () => void;
}

interface BlankProjectInputs {
  is_private: boolean;
  namespace: string;
  project_name: string;
  tag: string;
  description: string;
}

const BlankProjectForm = () => {
  // get user innfo
  const { user } = useSession();

  // instantiate form
  const {
    reset: resetForm,
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<BlankProjectInputs>();

  const onSubmit: SubmitHandler<BlankProjectInputs> = (data) => alert(JSON.stringify(data, null, 2));

  return (
    <form id="blank-project-form" className="border-0 form-control" onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-3 mt-3 form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="blank-is-private-toggle"
          {...register('is_private')}
        />
        <label className="form-check-label">
          <i className="bi bi-lock"></i>
          Private
        </label>
      </div>
      <span className="fs-4 d-flex align-items-center">
        <select
          id="blank-namespace-select"
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
          {...register('project_name', { required: true })}
          id="blank-project-name"
          type="text"
          className="form-control"
          placeholder="name"
        />
        <span className="mx-1 mb-1">:</span>
        <input {...register('tag')} id="blank_tag" type="text" className="form-control" placeholder="default" />
      </span>
      <textarea
        id="blank_description"
        className="form-control mt-3"
        rows={3}
        placeholder="Describe your PEP."
        {...register('description')}
      ></textarea>
      <div className="mt-3">
        <button
          disabled={!isValid}
          id="blank-project-submit-btn"
          className="btn btn-success me-1"
          type="submit"
          onClick={() => handleSubmit(onSubmit)}
        >
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

interface FromFileInputs {
  is_private: boolean;
  namespace: string;
  project_name: string;
  tag: string;
  description: string;
  files: FileList;
}

const PEPUploadForm = () => {
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

  // dnd stuff
  const onDrop = useCallback((files: File[]) => {
    // assign files to input value
    const fileList = new DataTransfer();
    for (let i = 0; i < files.length; i++) {
      fileList.items.add(files[i]);
    }
    setValue('files', fileList.files);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });
  const { ref: dropzoneInputRef, ...dropzoneProps } = getRootProps();

  // ref to file input element
  const fileInput = useRef<HTMLInputElement | null>(dropzoneInputRef);
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
      {uploadFiles ? (
        <div
          id="file-list-container"
          className="dashed-border p-5 mt-3 border border-2 d-flex flex-column align-items-center justify-content-center rounded-3"
        >
          <div className="d-flex flex-column align-items-center">
            {Array.from(uploadFiles).map((file, i) => (
              <div className="d-flex flex-row align-items-center">
                <span key={file.name} className="mt-1 me-2">
                  {file.name}
                </span>
                <button
                  onClick={() => popFileFromFileList(uploadFiles, i, setValue)}
                  className="btn btn-sm py-0 px-1 btn-outline-danger "
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            ))}
            <div className="mt-3">
              <button
                onClick={() => fileInput.current?.click()}
                type="button"
                className="btn btn-sm btn-outline-dark me-1"
              >
                <i className="bi bi-archive me-1"></i>
                Browse
              </button>
              <button
                onClick={() => resetForm({ files: undefined })}
                type="button"
                className="btn btn-sm btn-outline-dark me-1"
              >
                <i className="bi bi-x me-1"></i>
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          {...dropzoneProps}
          id="dnd-box"
          onClick={() => {
            fileInput.current?.click();
          }}
          className="dnd-box p-5 mt-3 border border-2 d-flex flex-column align-items-center justify-content-center rounded-3"
        >
          <div className="flex-row d-flex align-items-center">
            <i className="bi bi-cloud-arrow-up"></i>
            <span className="text-secondary ms-2">Drag files here</span>
          </div>
          <span className="my-1 text-secondary">or</span>
          <span className="text-secondary">click to browse</span>
        </div>
      )}
      {/* hidden file input */}
      <input
        ref={(e) => {
          fileInputFormRef(e);
          fileInput.current = e;
        }}
        hidden
        multiple
        type="file"
        id="files"
        {...fileInputProps}
        {...getInputProps()}
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

export const AddPEPModal: FC<Props> = ({ show, onHide }) => {
  const { user } = useSession();

  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Submit a new PEP</h1>
      </Modal.Header>
      <Modal.Body>
        <Tabs defaultActiveKey="blank" id="uncontrolled-tab">
          <Tab
            eventKey="blank"
            title={
              <span>
                <i className="bi bi-pencil me-1"></i>
                Blank
              </span>
            }
          >
            <div className="border border-top-0">
              <BlankProjectForm />
            </div>
          </Tab>
          <Tab
            eventKey="from-file"
            title={
              <span>
                <i className="bi bi-cloud-upload me-1"></i>
                Upload
              </span>
            }
          >
            <div className="border border-top-0">
              <PEPUploadForm />
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
};
