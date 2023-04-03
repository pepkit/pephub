import { FC, useRef, useCallback, RefCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FieldValues, UseFormRegisterReturn, UseFormReset, UseFormSetValue } from 'react-hook-form';
import { popFileFromFileList } from '../../../utils/dragndrop';

type FileInputProps = Omit<UseFormRegisterReturn, 'ref'>;

interface Props {
  files: FileList | undefined;
  reset: () => void;
  setFiles: (files: FileList) => void;
  fileInputProps: FileInputProps;
  ref: RefCallback<HTMLInputElement>;
}

export const FileDropZone: FC<Props> = ({ files, setFiles, reset, fileInputProps, ref }) => {
  // dnd stuff
  const onDrop = useCallback((files: File[]) => {
    // assign files to input value
    const fileList = new DataTransfer();
    for (let i = 0; i < files.length; i++) {
      fileList.items.add(files[i]);
    }
    setFiles(fileList.files);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });
  const { ref: dropzoneInputRef, ...dropzoneProps } = getRootProps();

  // ref to file input element
  const fileInput = useRef<HTMLInputElement | null>(dropzoneInputRef);

  if (files) {
    return (
      <div
        id="file-list-container"
        className="dashed-border p-5 mt-3 border border-2 d-flex flex-column align-items-center justify-content-center rounded-3"
      >
        <div className="d-flex flex-column align-items-center">
          {Array.from(files).map((file, i) => (
            <div className="d-flex flex-row align-items-center">
              <span key={file.name} className="mt-1 me-2">
                {file.name}
              </span>
              <button
                onClick={() => popFileFromFileList(files, i, (files) => setFiles(files))}
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
            <button onClick={() => reset()} type="button" className="btn btn-sm btn-outline-dark me-1">
              <i className="bi bi-x me-1"></i>
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <>
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
        {/* hidden file input */}
        <input
          ref={(e) => {
            ref(e);
            fileInput.current = e;
          }}
          hidden
          multiple
          type="file"
          id="files"
          {...fileInputProps}
          {...getInputProps()}
        />
      </>
    );
  }
};
