import { FC, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { FileDropZone } from './components/file-dropzone';
import Select from 'react-select';
import { useSession } from '../../hooks/useSession';
import { useNamespaceProjects } from '../../hooks/queries/useNamespaceProjects';
import { useSchemas } from '../../hooks/queries/useSchemas';
import { popFileFromFileList } from '../../utils/dragndrop';

interface ValidatorFormInputs {
  peps?: FileList;
  pepRegistryPath?: string;
  schemaFiles?: FileList;
  schemaRegistryPath?: string;
}

export const ValidatorForm: FC = () => {
  const { user, jwt } = useSession();
  const { data: projects } = useNamespaceProjects(user?.login, jwt || '', {});
  const { data: schemas } = useSchemas();

  // instantiate form
  const {
    reset: resetForm,
    handleSubmit,
    control,
    watch,
    formState: { isValid, isDirty },
  } = useForm<ValidatorFormInputs>();

  const fileDialogRef = useRef<() => void | null>(null);

  const [useExistingPEP, setUseExistingPEP] = useState(false);
  const [useExistingSchema, setUseExistingSchema] = useState(true);

  const peps = watch('peps');
  const schemaFiles = watch('schemaFiles');

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
            checked={useExistingPEP}
            onChange={() => setUseExistingPEP(!useExistingPEP)}
          />
          <label className="form-check-label" htmlFor="use-existing">
            Use existing?
          </label>
        </div>
        {useExistingPEP ? (
          <Controller
            name="pepRegistryPath"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                isClearable
                placeholder="Select a PEP"
                className="mt-2"
                // @ts-ignore
                options={
                  projects?.items.map((project) => ({
                    value: `${project.namespace}/${project.name}:${project.tag}`,
                    label: `${project.namespace}/${project.name}:${project.tag}`,
                  })) || []
                }
              />
            )}
          />
        ) : peps ? (
          <div className="d-flex flex-column align-items-center">
            {Array.from(peps).map((file, i) => {
              return (
                <div key={i} className="flex-row d-flex align-items-center">
                  <i className="bi bi-file-earmark-text me-1"></i>
                  <span className="text-secondary">{file.name}</span>
                  <button
                    onClick={() => {
                      popFileFromFileList(peps, i, (newFiles) => resetForm({ peps: newFiles }));
                    }}
                    className="py-0 btn btn-link text-danger shadow-none"
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                </div>
              );
            })}
            <button onClick={() => resetForm({ peps: undefined })} className="mt-2 btn btn-sm btn-outline-dark">
              Clear
            </button>
          </div>
        ) : (
          <FileDropZone multiple name="peps" control={control} innerRef={fileDialogRef} />
        )}
        <div className="my-3"></div>
        <label className="form-label fw-bold h5">2. Select your schema</label>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="use-existing"
            checked={useExistingSchema}
            onChange={() => setUseExistingSchema(!useExistingSchema)}
          />
          <label className="form-check-label" htmlFor="use-existing">
            Use existing?
          </label>
        </div>
        {useExistingSchema ? (
          <Controller
            name="schemaRegistryPath"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                isClearable
                placeholder="Select a schema"
                className="mt-2"
                // @ts-ignore
                options={schemas ? Object.keys(schemas).map((schema) => ({ value: schema, label: schema })) : []}
              />
            )}
          />
        ) : schemaFiles ? (
          <div className="d-flex flex-column align-items-center">
            {Array.from(schemaFiles).map((file, i) => {
              return (
                <div key={i} className="flex-row d-flex align-items-center">
                  <i className="bi bi-file-earmark-text me-1"></i>
                  <span className="text-secondary">{file.name}</span>
                  <button
                    onClick={() => {
                      popFileFromFileList(schemaFiles, i, (newFiles) => resetForm({ schemaFiles: newFiles }));
                    }}
                    className="py-0 btn btn-link text-danger shadow-none"
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                </div>
              );
            })}
            <button onClick={() => resetForm({ schemaFiles: undefined })} className="mt-2 btn btn-sm btn-outline-dark">
              Clear
            </button>
          </div>
        ) : (
          <FileDropZone multiple name="schemaFiles" control={control} innerRef={fileDialogRef} />
        )}
        <div className="mt-3">
          <button disabled={!isValid} type="button" className="me-1 btn btn-success">
            Validate
          </button>
          <button disabled={!isDirty} type="button" onClick={() => resetForm()} className="me-1 btn btn-outline-dark">
            Reset
          </button>
        </div>
      </div>
    </form>
  );
};
