import Editor from '@monaco-editor/react';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { OverlayTrigger, Tab, Tabs, Tooltip } from 'react-bootstrap';
import { Controller, useForm } from 'react-hook-form';
import Select from 'react-select';

import { useNamespaceProjects } from '../../hooks/queries/useNamespaceProjects';
import { useSchema } from '../../hooks/queries/useSchema';
import { useSchemas } from '../../hooks/queries/useSchemas';
import { useValidation } from '../../hooks/queries/useValidation';
import { useSession } from '../../hooks/useSession';
import { popFileFromFileList } from '../../utils/dragndrop';
import { FileDropZone } from './components/file-dropzone';

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
  schemaPaste?: string;
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

  const [useExistingPEP, setUseExistingPEP] = useState(true);
  const [useExistingSchema, setUseExistingSchema] = useState(false);
  const [schemaString, setSchemaString] = useState<string | undefined>(undefined);
  const [schemaPaste, setSchemaPaste] = useState<string>('');

  // watch the form data so we can use it
  const pepFiles = watch('pepFiles');
  const pepRegistryPath = watch('pepRegistryPath');
  const schemaFiles = watch('schemaFiles');
  const schemaRegistryPath = watch('schemaRegistryPath');

  const { data: schema } = useSchema(schemaRegistryPath?.value);
  const params = useMemo(() => {
    if (useExistingPEP) {
      return {
        pep: pepRegistryPath?.value,
        schema: schemaString,
        schema_registry: undefined,
        enabled: true,
      };
    } else {
      return {
        pep: pepFiles,
        schema: schemaString,
        schema_registry: undefined,
        enabled: true,
      };
    }
  }, [useExistingPEP, pepFiles, pepRegistryPath?.value, schemaString]);

  const { data: result, error, isFetching: isValidating, refetch } = useValidation(params);

  // handle schema changes to update the schema string
  useEffect(() => {
    // when these change, we need to parse either to a string
    if (useExistingSchema) {
      setSchemaString(JSON.stringify(schema));
    } else {
      // read contents from file
      if (schemaFiles) {
        const reader = new FileReader();
        reader.onload = () => {
          setSchemaString(reader.result as string);
        };
        reader.readAsText(schemaFiles[0]);
      } else if (schemaPaste) {
        setSchemaString(schemaPaste);
      }
    }
  }, [schemaRegistryPath?.value, schemaFiles, schema, schemaPaste]);

  const resetValidator = () => {
    resetForm({
      pepFiles: undefined,
      pepRegistryPath: undefined,
      schemaFiles: undefined,
      schemaRegistryPath: undefined,
      schemaPaste: undefined,
    });
    setUseExistingPEP(false);
  };

  const runValidation = () => {
    refetch();
  };

  const handleSchemaPaste = (value: string | undefined) => {
    setSchemaPaste(value || '');
  };

  return (
    <>
      <form className="form-control border-dark shadow-sm">
        <div className="p-2">
          <label className="form-label fw-bold h5">1. Select your PEP</label>
          <Tabs>
            <Tab eventKey="existing" title="Use existing PEP">
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
                    />
                  )}
                />
              </div>
            </Tab>
            <Tab eventKey="new" title="Upload PEP">
              <div className="d-flex flex-column align-items-center w-100 border border-top-0 rounded-bottom pb-3">
                {pepFiles ? (
                  <>
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
                    <button
                      onClick={() => resetForm({ pepFiles: undefined })}
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
          <Tabs>
            <Tab eventKey="existing" title="Use existing schema">
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
                {schemaFiles ? (
                  <div className="d-flex flex-column align-items-center w-00">
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
                  <div className="w-100 px-2">
                    <FileDropZone multiple name="schemaFiles" control={control} innerRef={fileDialogRef} />
                  </div>
                )}
              </div>
            </Tab>
            <Tab eventKey="paste" title="Paste schema">
              <div className="p-2 border border-top-0 rounded-bottom">
                    <Editor
                      height={'40vh'}
                      language="yaml"
                      value={schemaPaste}
                      onChange={(value) => handleSchemaPaste(value)}
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
                  <p className="mb-0">
                    {result.error_type !== 'Schema' && (
                      <>
                        Errors found in {result.error_type}{' '}
                        {result.sample_names && (
                          <OverlayTrigger overlay={<Tooltip id="validation">{result.sample_names}</Tooltip>}>
                            <i className="bi bi-info-circle me-2 mb-2"></i>
                          </OverlayTrigger>
                        )}
                        <br />
                        <br />
                      </>
                    )}
                  </p>
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
