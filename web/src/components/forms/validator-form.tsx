import Editor from '@monaco-editor/react';
import { FC, useRef, useState } from 'react';
import { Tab, Tabs } from 'react-bootstrap';
import { Controller, useForm } from 'react-hook-form';
import Select from 'react-select';

import { useNamespaceProjects } from '../../hooks/queries/useNamespaceProjects';
import { useSchemas } from '../../hooks/queries/useSchemas';
import { ValidationParams } from '../../hooks/queries/useValidation';
import { useValidation } from '../../hooks/queries/useValidation';
import { useSession } from '../../hooks/useSession';
import { popFileFromFileList } from '../../utils/dragndrop';
import { FileDropZone } from './components/file-dropzone';

interface ValidatorFormInputs {
  pepFiles?: FileList;
  pepRegistryPath?: {
    label: string;
    value: string;
  } | null;
  schemaFile?: FileList;
  schemaRegistryPath?: {
    label: string;
    value: string;
  } | null;
  schemaPaste?: string;
}

interface ValidatorFormProps {
  defaultPepRegistryPath?: string;
  defaultSchemaRegistryPath?: string;
}

export const ValidatorForm: FC<ValidatorFormProps> = ({ defaultPepRegistryPath, defaultSchemaRegistryPath }) => {
  const { user, jwt, login } = useSession();
  const { data: projects } = useNamespaceProjects(user?.login, jwt || '', {});
  const { data: schemas } = useSchemas();

  // instantiate form
  const {
    reset: resetForm,
    setValue: setFormValue,
    control,
    watch,
    formState: { isValid, isDirty },
  } = useForm<ValidatorFormInputs>({
    defaultValues: {
      pepRegistryPath: defaultPepRegistryPath
        ? {
            label: defaultPepRegistryPath || '',
            value: defaultPepRegistryPath || '',
          }
        : null,
      schemaRegistryPath: defaultSchemaRegistryPath
        ? {
            label: defaultSchemaRegistryPath || '',
            value: defaultSchemaRegistryPath || '',
          }
        : null,
    },
  });

  const fileDialogRef = useRef<() => void | null>(null);

  const [useExistingPEP, setUseExistingPEP] = useState(true);
  const [useExistingSchema, setUseExistingSchema] = useState(true);

  // watch the form data so we can use it
  const pepFiles = watch('pepFiles');
  const pepRegistryPath = watch('pepRegistryPath');
  const schemaFile = watch('schemaFile');
  const schemaRegistryPath = watch('schemaRegistryPath');
  const schemaPasteValue = watch('schemaPaste');

  // validation params for the useValidation hook
  let params = {
    enabled: false,
  } as ValidationParams;

  // populate params based on form data for the PEP
  if (useExistingPEP) {
    params.pep_registry = pepRegistryPath?.value;
    params.pep_files = undefined;
  } else {
    params.pep_registry = undefined;
    params.pep_files = pepFiles;
  }

  // populate params based on form data for the schema
  if (useExistingSchema) {
    params.schema_registry = schemaRegistryPath?.value;
    params.schema = undefined;
  } else if (schemaPasteValue) {
    params.schema_registry = undefined;
    params.schema = schemaPasteValue;
  } else {
    params.schema_registry = undefined;
    // just take the first file they give
    params.schema_file = schemaFile && schemaFile.length > 0 ? schemaFile[0] : undefined;
  }

  // only enable if one of the PEP options is selected and
  // one of the schema options is selected
  // if (useExistingPEP && useExistingSchema) {
  //   params.enabled = !!pepRegistryPath && !!schemaRegistryPath;
  // } else if (!!useExistingPEP && !useExistingSchema) {
  //   params.enabled = !!pepRegistryPath && (!!schemaPasteValue || !!schemaFile);
  // } else if (!useExistingPEP && useExistingSchema) {
  //   params.enabled = !!pepFiles && !!schemaRegistryPath;
  // } else {
  //   params.enabled = !!pepFiles && (!!schemaPasteValue || !!schemaFile);
  // }

  // validator hook
  const { data: result, error, isFetching: isValidating, refetch } = useValidation(params);

  const resetValidator = () => {
    resetForm({
      pepFiles: undefined,
      pepRegistryPath: null,
      schemaFile: undefined,
      schemaRegistryPath: null,
      schemaPaste: undefined,
    });
  };

  const runValidation = () => {
    refetch();
  };

  return (
    <>
      {/* Only in development mode  */}
      {/* render the params */}
      {process.env.NODE_ENV === 'development' && (
        <div className="my-3">
          <pre>
            <code>{JSON.stringify(params, null, 2)}</code>
          </pre>
          <pre>
            <code>Use existing PEP: {JSON.stringify(useExistingPEP)}</code>
            <br />
            <code>Use existing schema: {JSON.stringify(useExistingSchema)}</code>
          </pre>
        </div>
      )}
      <form className="form-control border-dark shadow-sm">
        <div className="p-2">
          <label className="form-label fw-bold h5">1. Select your PEP</label>
          <Tabs
            defaultActiveKey="existing"
            id="pep-tabs"
            onSelect={(key) => {
              if (key === 'existing') {
                setUseExistingPEP(true);
              } else {
                setUseExistingPEP(false);
              }
            }}
          >
            <Tab eventKey="existing" title="From PEPhub">
              <div className="p-2 border border-top-0 rounded-bottom">
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
                      noOptionsMessage={() => {
                        if (user) {
                          return (
                            <span>
                              No PEPs found in your namespace. <a href={`/${user.login}`}>Create a new PEP</a>.
                            </span>
                          );
                        } else {
                          return (
                            <span>
                              <span className="text-primary cursor-pointer" onClick={() => login()}>
                                Log in
                              </span>{' '}
                              to see your PEPs.
                            </span>
                          );
                        }
                      }}
                    />
                  )}
                />
              </div>
            </Tab>
            <Tab eventKey="new" title="Upload PEP">
              <div className="d-flex flex-column align-items-center w-100 border border-top-0 rounded-bottom py-3">
                {pepFiles ? (
                  <>
                    {Array.from(pepFiles).map((file, i) => {
                      return (
                        <div key={i} className="flex-row d-flex align-items-center">
                          <i className="bi bi-file-earmark-text me-1"></i>
                          <span className="text-secondary">{file.name}</span>
                          <button
                            onClick={() => {
                              popFileFromFileList(pepFiles, i, (newFiles) => setFormValue('pepFiles', newFiles));
                            }}
                            className="py-0 btn btn-link text-danger shadow-none"
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => setFormValue('pepFiles', undefined)}
                      className="mt-2 btn btn-sm btn-outline-dark"
                    >
                      Clear
                    </button>
                  </>
                ) : (
                  <div className="w-100 px-2">
                    <FileDropZone multiple name="pepFiles" control={control} innerRef={fileDialogRef} />
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
          <div className="my-3"></div>
          <label className="form-label fw-bold h5">2. Select your schema</label>
          <Tabs
            defaultActiveKey="existing"
            onSelect={(key) => {
              if (key === 'existing') {
                setUseExistingSchema(true);
              } else {
                setUseExistingSchema(false);
              }
            }}
          >
            <Tab eventKey="existing" title="From PEPhub">
              <div className="p-2 border border-top-0 rounded-bottom">
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
              </div>
            </Tab>
            <Tab eventKey="new" title="Upload schema">
              <div className="d-flex flex-column align-items-center w-100 border border-top-0 rounded-bottom pb-3">
                {schemaFile ? (
                  <div className="d-flex flex-column align-items-center w-100 pt-2">
                    {Array.from(schemaFile).map((file, i) => {
                      return (
                        <div key={i} className="flex-row d-flex align-items-center">
                          <i className="bi bi-file-earmark-text me-1"></i>
                          <span className="text-secondary">{file.name}</span>
                          <button
                            onClick={() => {
                              popFileFromFileList(schemaFile, i, (newFiles) => setFormValue('schemaFile', newFiles));
                            }}
                            className="py-0 btn btn-link text-danger shadow-none"
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => setFormValue('schemaFile', undefined)}
                      className="mt-2 btn btn-sm btn-outline-dark"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="w-100 px-2">
                    <FileDropZone multiple name="schemaFile" control={control} innerRef={fileDialogRef} />
                  </div>
                )}
              </div>
            </Tab>
            <Tab eventKey="paste" title="Paste schema">
              <div className="p-2 border border-top-0 rounded-bottom">
                <Controller
                  name="schemaPaste"
                  control={control}
                  render={({ field }) => <Editor {...field} height={'40vh'} language="yaml" />}
                />
              </div>
            </Tab>
          </Tabs>
          <div className="mt-3">
            <button onClick={() => runValidation()} disabled={!isValid} type="button" className="me-1 btn btn-success">
              Validate
            </button>
            <button
              disabled={!isDirty}
              type="button"
              onClick={() => resetValidator()}
              className="me-1 btn btn-outline-dark"
            >
              Reset
            </button>
          </div>
        </div>
      </form>
      <div className="my-3">
        {isValidating ? (
          <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '300px' }}>
            <img className="bounce" src="/pep-dark.svg" alt="loading" width="50" height="50" />
            <p className="text-muted">Validating...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            <pre>
              <code>{JSON.stringify(error, null, 2)}</code>
            </pre>
          </div>
        ) : result ? (
          <>
            {result.valid ? (
              <div className="alert alert-success" role="alert">
                <p className="mb-0">PEP is valid!</p>
              </div>
            ) : (
              <>
                <div className="alert alert-danger" role="alert">
                  <p className="mb-0">
                    {result.error_type === 'Schema' ? 'Schema is invalid, found issue with:' : 'PEP is invalid!'}
                  </p>
                  <p className="mb-0">{result.error_type !== 'Schema' && <>Errors found in {result.error_type} </>}</p>
                  <code className="error-code">
                    {result.errors.map((e) => (
                      <pre className="mb-2 text-danger" key={e}>
                        <i className="bi bi bi-exclamation-triangle me-2"></i>
                        {`${e}`}
                      </pre>
                    ))}
                  </code>
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </>
  );
};
