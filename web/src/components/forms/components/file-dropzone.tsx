import { FC, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Controller } from 'react-hook-form';

interface FileDropzoneProps {
  name: string;
  multiple?: boolean;
  control: any;
  innerRef?: any;
}

export const FileDropZone: FC<FileDropzoneProps> = ({ name, multiple = true, control, innerRef }) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange } }) => (
        <Dropzone
          innerRef={innerRef}
          multiple={multiple}
          onChange={(e) => {
            if (multiple) {
              onChange(e.target.files);
            } else {
              onChange(e.target.files ? e.target.files[0] : undefined);
            }
          }}
        />
      )}
    />
  );
};

interface DropzoneProps {
  multiple?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  innerRef?: any;
}

const Dropzone: FC<DropzoneProps> = ({ multiple = true, onChange, innerRef }) => {
  const { acceptedFiles, getRootProps, getInputProps, open } = useDropzone({
    multiple,
  });

  innerRef.current = open;

  // when files are accepted, update the form
  useEffect(() => {
    if (acceptedFiles.length > 0) {
      // convert to FileList
      const fileList = new DataTransfer();
      acceptedFiles.forEach((file) => fileList.items.add(file));
      // @ts-ignore
      onChange({ target: { files: fileList.files } });
    }
  }, [acceptedFiles]);

  return (
    <div
      {...getRootProps()}
      className="dnd-box p-5 border border-2 d-flex flex-column align-items-center justify-content-center rounded-3"
    >
      <div className="flex-row d-flex align-items-center">
        <i className="bi bi-cloud-arrow-up"></i>
        {multiple ? (
          <span className="text-secondary ms-2">Drag files here or click to browse</span>
        ) : (
          <span className="text-secondary ms-2">Drag file here or click to browse</span>
        )}
      </div>
      <span className="my-1 text-secondary">or</span>
      <span className="text-secondary">click to browse</span>
      <input ref={innerRef} {...getInputProps({ onChange })} />
    </div>
  );
};
