import { HotTable } from '@handsontable/react';
import Editor from '@monaco-editor/react';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Select from 'react-select';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';


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

  const [useExistingPEP, setUseExistingPEP] = useState(false);
  const [useExistingSchema, setUseExistingSchema] = useState(true);
  const [schemaString, setSchemaString] = useState<string | undefined>(undefined);
  // const [activePepPasteTab, setActivePepPasteTab] = useState('pepPaste1');

  // watch the form data so we can use it
  const pepFiles = watch('pepFiles');
  const pepRegistryPath = watch('pepRegistryPath');
  const schemaFiles = watch('schemaFiles');
  const schemaRegistryPath = watch('schemaRegistryPath');

  const [schemaPaste, setSchemaPaste] = useState<string>('');
  // const [pep_Paste1, setPepPaste1] = useState<string>('');
  // const [pep_Paste2, setPepPaste2] = useState<string>('');

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
    // setPepPaste1('');
    // setPepPaste2('');
  };

  const runValidation = () => {
    refetch();
  };

  const handleSchemaPaste = (value: string | undefined) => {
    setSchemaPaste(value || '');
  };
  // const handlePEPPaste1 = (value: string | undefined) => {
  //   setPepPaste1(value || '');
  // };
  // const handlePEPPaste2 = (value: string | undefined) => {
  //   setPepPaste2(value || '');
  // };

  // const handlePaste = (fieldName: string, value: string | undefined) => {
  //   if (fieldName === 'schemaPaste') {
  //     setSchemaPaste(value || '');
  //   } else if (fieldName === 'pepPaste1') {
  //     setPepPaste1(value || '');
  //   } else if (fieldName === 'pepPaste2') {
  //     setPepPaste2(value || '');
  //   }
  // };

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
          {/* {!useExistingPEP && !pepFiles && (
            <> */}

          {/* <div className="my-3">
                <ul className="nav nav-tabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activePepPasteTab === 'pepPaste1' ? 'active' : ''}`}
                      id="pepPaste1-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#pepPaste1"
                      type="button"
                      role="tab"
                      aria-controls="pepPaste1"
                      aria-selected={activePepPasteTab === 'pepPaste1'}
                      onClick={() => setActivePepPasteTab('pepPaste1')}
                    >
                      <i className="bi bi-table me-1"></i>Samples
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activePepPasteTab === 'pepPaste2' ? 'active' : ''}`}
                      id="pepPaste2-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#pepPaste2"
                      type="button"
                      role="tab"
                      aria-controls="pepPaste2"
                      aria-selected={activePepPasteTab === 'pepPaste2'}
                      onClick={() => setActivePepPasteTab('pepPaste2')}
                    >
                      <i className="bi bi-filetype-yml me-1"></i>Config
                    </button>
                  </li>
                </ul>
                <div className="tab-content">
                  <div
                    className={`tab-pane fade ${activePepPasteTab === 'pepPaste1' ? 'show active' : ''}`}
                    id="pepPaste1"
                    role="tabpanel"
                    aria-labelledby="pepPaste1-tab"
                  >
                    <div className="mt-2">
                    <div className="rounded rounded-2">
                      <HotTable
                        stretchH="all"
                        height={window.innerHeight - 500}
                        colHeaders={true}
                        dropdownMenu={true}
                        hiddenColumns={{
                          indicators: true,
                        }}
                        minRows={500}
                        contextMenu={[
                          'row_above',
                          'row_below',
                          '---------',
                          'col_left',
                          'col_right',
                          '---------',
                          'remove_row',
                          'remove_col',
                          '---------',
                          'alignment',
                          '---------',
                          'copy',
                          'cut',
                        ]}
                        multiColumnSorting={true}
                        filters={true}
                        rowHeaders={true}
                        manualRowMove={true}
                        licenseKey="non-commercial-and-evaluation"
                        manualColumnResize
                        
                      />
                    </div>
                      
                  </div>
                </div>
                  <div
                    className={`tab-pane fade ${activePepPasteTab === 'pepPaste2' ? 'show active' : ''}`}
                    id="pepPaste2"
                    role="tabpanel"
                    aria-labelledby="pepPaste2-tab"
                  >
                    <div className="mt-2">
                      <Editor
                        height={'40vh'}
                        language="yaml"
                        value={pep_Paste2}
                        onChange={(value) => handlePEPPaste2(value)}
                      />
                    </div>
                  </div>
                </div>
              </div> */}
          {/* </>
          )} */}

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
          {!useExistingSchema && !schemaFiles && (
            <>
              <div className="mt-2">
                <label className="form-label">Or paste your schema:</label>
                <Editor
                  height={'40vh'}
                  language="yaml"
                  value={schemaPaste}
                  onChange={(value) => handleSchemaPaste(value)}
                />
              </div>
            </>
          )}
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
                  <p className="mb-0">PEP is invalid!</p>
                  <p className="mb-0">
                    Errors found in {result.error_type}{' '}
                    {result.sample_names && (
                      <OverlayTrigger overlay={<Tooltip id="validation">{result.sample_names}</Tooltip>}>
                        <i className="bi bi-info-circle me-2 mb-2"></i>
                      </OverlayTrigger>
                    )}
                  </p>
                  <code>
                    {result.errors.map((e) => (
                      <pre className="mb-0 text-danger" key={e}>
                        {`-> ${e}`}
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
