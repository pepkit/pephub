import { FC } from 'react';
import { useDropzone } from 'react-dropzone';
import { Control, Controller } from 'react-hook-form';

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
          onChange={(e) => onChange(multiple ? e.target.files : e.target.files ? e.target.files[0] : undefined)}
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
  const { getRootProps, getInputProps, open } = useDropzone({
    multiple,
  });

  innerRef.current = open;

  return (
    <div
      {...getRootProps()}
      className="dnd-box p-5 mt-3 border border-2 d-flex flex-column align-items-center justify-content-center rounded-3"
    >
      <div className="flex-row d-flex align-items-center">
        <i className="bi bi-cloud-arrow-up"></i>
        <span className="text-secondary ms-2">Drag files here</span>
      </div>
      <span className="my-1 text-secondary">or</span>
      <span className="text-secondary">click to browse</span>
      <input ref={innerRef} {...getInputProps({ onChange })} />
    </div>
  );
};
