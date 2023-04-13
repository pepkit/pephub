import { FC, useRef, useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { FileDropZone } from './components/file-dropzone';
import Select from 'react-select';
import { useSession } from '../../hooks/useSession';
import { useNamespaceProjects } from '../../hooks/queries/useNamespaceProjects';
import { useSchemas } from '../../hooks/queries/useSchemas';
import { popFileFromFileList } from '../../utils/dragndrop';
import { useValidation } from '../../hooks/queries/useValidation';
import { useSchema } from '../../hooks/queries/useSchema';

interface ValidatorFormInputs {
  pepFiles?: FileList;
  pepRegistryPath?: {
    label: string;
    value: string;
  };
  schemaFiles?: FileList;
  schemaRegistryPath?: {
    label: string;
    value: string;
  };
}

export const ValidatorForm: FC = () => {
  const { user, jwt } = useSession();
  const { data: projects } = useNamespaceProjects(user?.login, jwt || '', {});
  const { data: schemas } = useSchemas();

  // instantiate form
  const {
    reset: resetForm,
    control,
    watch,
    formState: { isValid, isDirty },
  } = useForm<ValidatorFormInputs>();

  const fileDialogRef = useRef<() => void | null>(null);

  const [useExistingPEP, setUseExistingPEP] = useState(false);
  const [useExistingSchema, setUseExistingSchema] = useState(true);
  const [schemaString, setSchemaString] = useState<string | undefined>(undefined);

  // watch the form data so we can use it
  const pepFiles = watch('pepFiles');
  const pepRegistryPath = watch('pepRegistryPath');
  const schemaFiles = watch('schemaFiles');
  const schemaRegistryPath = watch('schemaRegistryPath');

  const { data: schema } = useSchema(schemaRegistryPath?.value);

  const {
    data: result,
    error,
    isFetching,
    refetch,
  } = useValidation(useExistingPEP ? pepRegistryPath?.value : pepFiles, schemaString);

  useEffect(() => {
    // when these change, we need to parse either to a string
    debugger;
    if (useExistingSchema) {
      setSchemaString(JSON.stringify(schema));
    } else {
      // read contents from file
      if (schemaFiles) {
        const reader = new FileReader();
        reader.readAsText(schemaFiles[0]);
        reader.onload = () => {
          setSchemaString(reader.result as string);
        };
      }
    }
  }, [schemaRegistryPath?.value, schemaFiles]);

  const runValidation = () => {
    refetch();
  };

  return (
    <>
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
          ) : pepFiles ? (
            <div className="d-flex flex-column align-items-center">
              {Array.from(pepFiles).map((file, i) => {
                return (
                  <div key={i} className="flex-row d-flex align-items-center">
                    <i className="bi bi-file-earmark-text me-1"></i>
                    <span className="text-secondary">{file.name}</span>
                    <button
                      onClick={() => {
                        popFileFromFileList(pepFiles, i, (newFiles) => resetForm({ pepFiles: newFiles }));
                      }}
                      className="py-0 btn btn-link text-danger shadow-none"
                    >
                      <i className="bi bi-x-circle"></i>
                    </button>
                  </div>
                );
              })}
              <button onClick={() => resetForm({ pepFiles: undefined })} className="mt-2 btn btn-sm btn-outline-dark">
                Clear
              </button>
            </div>
          ) : (
            <FileDropZone multiple name="pepFiles" control={control} innerRef={fileDialogRef} />
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
              <button
                onClick={() => resetForm({ schemaFiles: undefined })}
                className="mt-2 btn btn-sm btn-outline-dark"
              >
                Clear
              </button>
            </div>
          ) : (
            <FileDropZone multiple name="schemaFiles" control={control} innerRef={fileDialogRef} />
          )}
          <div className="mt-3">
            <button onClick={() => runValidation()} disabled={!isValid} type="button" className="me-1 btn btn-success">
              Validate
            </button>
            <button disabled={!isDirty} type="button" onClick={() => resetForm()} className="me-1 btn btn-outline-dark">
              Reset
            </button>
          </div>
        </div>
      </form>
      <div>
        {isFetching ? (
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            "error"
          </div>
        ) : result ? (
          <div className="alert alert-success" role="alert">
            "result"
          </div>
        ) : null}
      </div>
    </>
  );
};
