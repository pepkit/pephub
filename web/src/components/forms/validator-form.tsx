import Editor from '@monaco-editor/react';
import { useQueries } from '@tanstack/react-query';
import { FC, useMemo, useRef, useState } from 'react';
import { Tab, Tabs } from 'react-bootstrap';
import { Controller, useForm } from 'react-hook-form';
import Select from 'react-select';

import { getNamespaceProjects } from '../../api/namespace';
import { useSession } from '../../contexts/session-context';
import { PepValidationOutcome, validatePep } from '../../utils/validate-pep';
import {
  prepareSchema,
  preparePepFromFiles,
  preparePepFromRegistry,
} from '../../utils/validator-form-helpers';
import { popFileFromFileList } from '../../utils/dragndrop';
import { FileDropZone } from './components/file-dropzone';
import { SchemaDropdown } from './components/schemas-databio-dropdown';

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

  const namespaces = useMemo(
    () => (user ? [user.login, ...(user.orgs ?? [])] : []),
    [user],
  );

  const projectQueries = useQueries({
    queries: namespaces.map((ns) => ({
      queryKey: [ns, {}],
      queryFn: () => getNamespaceProjects(ns, jwt, {}),
      enabled: !!ns,
    })),
  });

  const pepOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { label: string; value: string }[] = [];
    projectQueries.forEach((q) => {
      q.data?.results?.forEach((project) => {
        const path = `${project.namespace}/${project.name}:${project.tag}`;
        if (!seen.has(path)) {
          seen.add(path);
          opts.push({ value: path, label: path });
        }
      });
    });
    return opts;
  }, [projectQueries]);

  const {
    reset: resetForm,
    setValue: setFormValue,
    control,
    watch,
    formState: { isValid, isDirty },
  } = useForm<ValidatorFormInputs>({
    defaultValues: {
      pepRegistryPath: defaultPepRegistryPath
        ? { label: defaultPepRegistryPath, value: defaultPepRegistryPath }
        : null,
      schemaRegistryPath: defaultSchemaRegistryPath
        ? { label: defaultSchemaRegistryPath, value: defaultSchemaRegistryPath }
        : null,
    },
  });

  const fileDialogRef = useRef<() => void | null>(null);

  const [useExistingPEP, setUseExistingPEP] = useState(true);
  const [useExistingSchema, setUseExistingSchema] = useState(true);

  const pepFiles = watch('pepFiles');
  const pepRegistryPath = watch('pepRegistryPath');
  const schemaFile = watch('schemaFile');
  const schemaRegistryPath = watch('schemaRegistryPath');
  const schemaPasteValue = watch('schemaPaste');

  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<PepValidationOutcome | undefined>();
  const [runError, setRunError] = useState<string | undefined>();
  const [validationTimeMs, setValidationTimeMs] = useState<number | undefined>();

  const resetValidator = () => {
    resetForm({
      pepFiles: undefined,
      pepRegistryPath: null,
      schemaFile: undefined,
      schemaRegistryPath: null,
      schemaPaste: undefined,
    });
    setResult(undefined);
    setRunError(undefined);
  };

  const runValidation = async () => {
    setIsValidating(true);
    setResult(undefined);
    setRunError(undefined);
    setValidationTimeMs(undefined);
    try {
      const pep = useExistingPEP
        ? await preparePepFromRegistry(pepRegistryPath?.value || '')
        : await preparePepFromFiles(pepFiles as FileList);

      const schema = await prepareSchema({
        registryPath: useExistingSchema ? schemaRegistryPath?.value : undefined,
        file: !useExistingSchema && schemaFile && schemaFile.length > 0 ? schemaFile[0] : undefined,
        pasted: !useExistingSchema && !schemaFile && schemaPasteValue ? schemaPasteValue : undefined,
      });

      const t0 = performance.now();
      const outcome = await validatePep({
        configYaml: pep.configYaml,
        samples: pep.samples,
        subsamples: pep.subsamples,
        schema,
      });
      setValidationTimeMs(performance.now() - t0);
      setResult(outcome);
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <>
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
                      options={pepOptions}
                      noOptionsMessage={() => {
                        if (user) {
                          return (
                            <span>
                              No PEPs found in your namespaces. <a href={`/${user.login}`}>Create a new PEP</a>.
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
                    <SchemaDropdown
                      value={field.value?.value || undefined}
                      onChange={(schema) => {
                        setFormValue('schemaRegistryPath', { value: schema, label: schema });
                      }}
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
            <button
              onClick={() => runValidation()}
              disabled={!isValid || isValidating}
              type="button"
              className="me-1 btn btn-success"
            >
              {isValidating ? 'Validating...' : 'Validate'}
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
        ) : runError ? (
          <div className="alert alert-danger" role="alert">
            <pre className="mb-0"><code>{runError}</code></pre>
          </div>
        ) : result ? (
          result.state === 'valid' ? (
            <div className="alert alert-success" role="alert">
              <p className="mb-0">
                PEP is valid!
                {validationTimeMs !== undefined && (
                  <span className="ms-2 text-muted small">({(validationTimeMs / 1000).toFixed(2)}s)</span>
                )}
              </p>
            </div>
          ) : result.state === 'error' ? (
            <div className="alert alert-danger" role="alert">
              <p className="mb-0">Validation could not run:</p>
              <pre className="mb-0"><code>{result.message}</code></pre>
            </div>
          ) : (
            <div className="alert alert-danger" role="alert">
              <p className="mb-0">
                PEP is invalid!
                {validationTimeMs !== undefined && (
                  <span className="ms-2 text-muted small">({(validationTimeMs / 1000).toFixed(2)}s)</span>
                )}
              </p>
              <p className="mb-0">Errors found in {result.errorType}</p>
              <code className="error-code">
                {result.errors.map((e, i) => (
                  <pre className="mb-2 text-danger" key={i}>
                    <i className="bi bi bi-exclamation-triangle me-2"></i>
                    {e}
                  </pre>
                ))}
              </code>
            </div>
          )
        ) : null}
      </div>
    </>
  );
};
