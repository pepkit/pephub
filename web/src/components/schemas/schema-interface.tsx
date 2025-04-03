import { Editor } from '@monaco-editor/react';
import { useEffect, useState, useRef } from 'react';
import { Fragment } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useEditSchemaVersionMutation } from '../../hooks/mutations/useEditSchemaVersionMutation';
import { useSchema } from '../../hooks/queries/useSchema';
import { useSchemaByVersion } from '../../hooks/queries/useSchemaByVersion';
import { getOS } from '../../utils/etc';
import { SchemaHeader } from './schema-header';
import { SchemaSidebar } from './schema-sidebar';
import { useSession } from '../../contexts/session-context';
import { CreateSchemaVersionModal } from '../modals/create-schema-version';
import { EditSchemaModal } from '../modals/edit-schema';
import { EditSchemaVersionModal } from '../modals/edit-schema-version';
import { DeleteSchemaVersionModal } from '../modals/delete-schema-version';
import { LoadingSpinner } from '../spinners/loading-spinner';
import { Schema } from '../../../types';

import { useSchemaVersionNumber } from '../../hooks/stores/useSchemaVersionNumber';
import { useCreateSchemaVersionModalStore } from '../../hooks/stores/useCreateSchemaVersionModalStore'
import { useEditSchemaVersionModalStore } from '../../hooks/stores/useEditSchemaVersionModalStore';
import { useDeleteSchemaVersionModalStore } from '../../hooks/stores/useDeleteSchemaVersionModalStore';
import { useSchemaEditModalStore } from '../../hooks/stores/useSchemaEditModalStore'

type FormFields = {
  schema: object;
};

type Props = {
  namespace: string;
  name: string;
  schemaData: ReturnType<typeof useSchema>['data'];
  schemaVersions: any;
  refetchSchemaVersions: () => void;
  canEdit: boolean;
};

export const SchemaInterface = (props: Props) => {
  const { schemaData, schemaVersions, canEdit, namespace, name, refetchSchemaVersions } = props;
  const { user } = useSession();

  const [confirmSave, setConfirmSave] = useState(false);
  const [saveButtonText, setSavebuttonText] = useState('Save');
  const [saveCountdown, setSaveCountdown] = useState(0);  

  const { schemaVersionNumber, setSchemaVersionNumber } = useSchemaVersionNumber();
  const { showCreateSchemaVersionModal, setShowCreateSchemaVersionModal } = useCreateSchemaVersionModalStore();
  const { showEditSchemaVersionModal, setShowEditSchemaVersionModal } = useEditSchemaVersionModalStore();
  const { showDeleteSchemaVersionModal, setShowDeleteSchemaVersionModal } = useDeleteSchemaVersionModalStore();
  const { showSchemaEditModal, setShowSchemaEditModal } = useSchemaEditModalStore();
    
  const currentSchemaRef = useRef<object>({});
  
  const allVersionNumbers = schemaVersions?.results.map((schema: Schema) => schema.version).sort().reverse();
  const selectedVersion = schemaVersions?.results[schemaVersions?.results.findIndex((schema: Schema) => schema.version === schemaVersionNumber)]

  useEffect(() => {
    if (schemaVersions && !schemaVersionNumber) {
      setSchemaVersionNumber(allVersionNumbers[0]);
    }
  }, [schemaVersionNumber]);

  const { data: schemaJson, isFetching: isFetching } = useSchemaByVersion(namespace, name, schemaVersionNumber);

  const { formState, watch, reset, control, setValue, getValues } = useForm<FormFields>({
    defaultValues: {
      schema: schemaJson
    },
  });

  useEffect(() => {
    if (schemaJson) {
      currentSchemaRef.current = schemaJson;
      setValue('schema', schemaJson, { shouldDirty: false });
    }
  }, [schemaJson, setValue]);

  const handleDiscard = () => {
    setSaveCountdown(0);
    setConfirmSave(false);
    setSavebuttonText('Save');
    reset({ schema: currentSchemaRef.current });
  };

  const handleVersionChange = () => {
    // setSchemaVersionNumber(versionNumber);
    // Reset form dirty state when version changes
    if (formState.isDirty) {
      reset({ schema: {} }, { keepDirty: false });
    }
  };

  const { isPending: isSubmitting, submit } = useEditSchemaVersionMutation(namespace, name);

  const handleSubmit = () => {
    setSaveCountdown(0);
    setConfirmSave(false);
    setSavebuttonText('Save');
    const formValues = getValues();
    
    submit(
      {
        schemaJson: formValues.schema,
        contributors: undefined,
        version: schemaVersionNumber || '',
        release_notes: undefined
      },
      {
        onSuccess: () => {
          reset({ schema: formValues.schema }, { keepDirty: false });
          // Update the reference to the current schema
          currentSchemaRef.current = formValues.schema;
        },
      }
    );
  };
  
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (saveCountdown > 0) {
      setSavebuttonText('Confirm Save and Overwrite? (' + saveCountdown + ')');
      timer = setTimeout (() => setSaveCountdown(saveCountdown - 1), 1000);
    } else if (saveCountdown === 0 && confirmSave) {
      setConfirmSave(false);
      setSavebuttonText('Save');
    }

    return () => clearTimeout(timer);
  }, [saveCountdown, confirmSave])

  const handleConfirm = () => {
    if (!confirmSave) {
      setSaveCountdown(5);
      setConfirmSave(true);
    } else {
      handleSubmit();
      setConfirmSave(false);
    }
  }

  useEffect(() => {
    const os = getOS();
    const handleSave = (e: KeyboardEvent) => {
      const ctrlKey = os === 'Mac OS' ? e.metaKey : e.ctrlKey;
      if (ctrlKey && e.key === 's') {
        if (true && !isSubmitting && formState.isDirty) {
          // TODO: why does this not work in production?
          // if (projectUpdates.formState.isDirty && !isSubmitting) {
          e.preventDefault();
          handleConfirm();
        }
      }
    };
    window.addEventListener('keydown', handleSave);
    return () => {
      window.removeEventListener('keydown', handleSave);
    };
  });

  return (
    <div className='container-fluid'>
      <div className='row'>
        <div className="d-flex align-items-center justify-content-between px-3">
          <SchemaHeader
            key={schemaData?.description}
          />
        </div>
        <div className='col-9 pe-1'>
          <div className="card rounded-2 m-3 mt-0 shadow-sm">
            <div className="card-header fw-semibold text-sm d-flex align-items-center justify-content-between">
              Editor (JSON)
              {/* {user && (user.login === namespace || user.orgs.includes(namespace || 'NONE')) && (sortedVersions[0]?.version === schemaVersionNumber) && ( */}
              {user && (user.login === namespace || user.orgs.includes(namespace || 'NONE')) && (
                <>
                  <button disabled={!formState.isDirty} onClick={handleConfirm} className="btn btn-xs btn-success ms-auto" id='save-schema-btn'>
                    {saveButtonText}
                  </button>
                  <button disabled={!formState.isDirty} onClick={handleDiscard} className="btn btn-xs btn-outline-dark ms-1">
                    Discard
                  </button>
                </>
              )}
            </div>
            <div className='card-body py-2'>
              {schemaJson ? (
                <Controller
                  name="schema"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Editor
                      options={{
                        readOnly: !canEdit,
                      }}
                      onChange={(v) => {
                        try {
                          // Try to parse the editor content as JSON
                          const jsonValue = typeof v === 'string' ? JSON.parse(v) : v;
                          onChange(jsonValue);
                        } catch (err) {
                          // If it's not valid JSON, just pass it through
                          onChange(v);
                        }
                      }}
                      saveViewState
                      language="json"
                      defaultLanguage="json"
                      value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                      loading={null}
                      height={'74vh'}
                    />
                  )}
                />
              ) : (
                isFetching ? (
                  <div className="text-center pt-5" style={{height:'74vh'}}>
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="text-center pt-5" style={{height:'74vh'}}>
                    <span className='fw-semibold'>No Schema found for this version.</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className='col-3'>
          <SchemaSidebar
            key={schemaData?.description}
            description={schemaData?.description || ''}
            maintainers={schemaData?.maintainers || ''}
            isPrivate={schemaData?.private || false}
            lifecycleStage={schemaData?.lifecycle_stage || ''}
            releaseNotes={selectedVersion?.release_notes}
            contributors={selectedVersion?.contributors}
            updateDate={selectedVersion?.last_update_date}
            releaseDate={selectedVersion?.release_date}
            allVersionNumbers={allVersionNumbers}
            tags={selectedVersion?.tags}
            canEdit={canEdit}
            handleVersionChange={handleVersionChange}
          />
        </div>
      </div>
      
      <EditSchemaModal
        namespace={namespace}
        name={name}
        description={schemaData?.description || ''}
        maintainers={schemaData?.maintainers || ''}
        lifecycleStage={schemaData?.lifecycle_stage || ''}
        isPrivate={schemaData?.private || false}
        show={showSchemaEditModal}
        onHide={() => setShowSchemaEditModal(false)}
      />
      <CreateSchemaVersionModal
        namespace={namespace}
        name={name}
        tags={selectedVersion?.tags}
        schemaJson={getValues('schema')}
        contributors={selectedVersion?.contributors}
        refetchSchemaVersions={refetchSchemaVersions}
        show={showCreateSchemaVersionModal}
        onHide={() => setShowCreateSchemaVersionModal(false)}
      />
      <EditSchemaVersionModal
        namespace={namespace}
        name={name}
        contributors={selectedVersion?.contributors}
        releaseNotes={selectedVersion?.release_notes}
        refetchSchemaVersions={refetchSchemaVersions}
        show={showEditSchemaVersionModal}
        onHide={() => setShowEditSchemaVersionModal(false)}
      />
      <DeleteSchemaVersionModal
        namespace={namespace}
        name={name}
        allVersions={allVersionNumbers}
        refetchSchemaVersions={refetchSchemaVersions}
        show={showDeleteSchemaVersionModal}
        onHide={() => setShowDeleteSchemaVersionModal(false)}
      />
    </div>
  );
};
