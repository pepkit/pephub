import { FC, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { FileDropZone } from './components/file-dropzone';
import Select from 'react-select';

interface ValidatorFormInputs {
  peps?: FileList;
  pepRegistryPath?: string;
  schemaFiles?: FileList;
  schemaRegistryPath?: string;
}

export const ValidatorForm: FC = () => {
  // instantiate form
  const {
    reset: resetForm,
    register,
    handleSubmit,
    control,
    watch,
    formState: { isValid, errors },
  } = useForm<ValidatorFormInputs>();

  const fileDialogRef = useRef<() => void | null>(null);

  const [useExisting, setUseExisting] = useState(false);
  return (
    <form className="form-control border-dark shadow-sm">
      <div className="p-2">
        <label className="form-label fw-bold h5">1. Select your PEP</label>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="use-existing"
            checked={useExisting}
            onChange={() => setUseExisting(!useExisting)}
          />
          <label className="form-check-label" htmlFor="use-existing">
            Use existing?
          </label>
        </div>
        {useExisting ? (
          <Controller
            name="pepRegistryPath"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                className="mt-2"
                options={[
                  { value: 'chocolate', label: 'Chocolate' },
                  { value: 'strawberry', label: 'Strawberry' },
                  { value: 'vanilla', label: 'Vanilla' },
                ]}
              />
            )}
          />
        ) : (
          <FileDropZone multiple name="peps" control={control} innerRef={fileDialogRef} />
        )}
      </div>
    </form>
  );
};
