import { Editor } from '@monaco-editor/react';
import { useEffect, useState, useRef } from 'react';
import { Fragment } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useEditSchemaMutation } from '../../hooks/mutations/useEditSchemaMutation';
import { useSchema } from '../../hooks/queries/useSchema';
import { useSchemaByVersion } from '../../hooks/queries/useSchemaByVersion';
import { getOS } from '../../utils/etc';
import { SchemaHeader } from './schema-header';
import { SchemaSidebar } from './schema-sidebar';
import { useSession } from '../../contexts/session-context';
import { VersionSchemaModal } from '../modals/version-schema';
import { EditSchemaModal } from '../modals/edit-schema';

import { useSchemaVersionModalStore } from '../../hooks/stores/useSchemaVersionModalStore'
import { useSchemaEditModalStore } from '../../hooks/stores/useSchemaEditModalStore'


type FormFields = {
  schema: object;
};

type Props = {
  namespace: string;
  name: string;
  schemaData: ReturnType<typeof useSchema>['data'];
  schemaVersions: any;
  canEdit: boolean;
};

export const SchemaInterface = (props: Props) => {
  const { schemaData, schemaVersions, canEdit, namespace, name } = props;
  const { user } = useSession();

  const [currentVersionNumber, setCurrentVersionNumber] = useState('');
  const { showSchemaVersionModal, setShowSchemaVersionModal } = useSchemaVersionModalStore();
  const { showSchemaEditModal, setShowSchemaEditModal } = useSchemaEditModalStore();
    
  const currentSchemaRef = useRef<object>({});

  const sortedVersions = schemaVersions?.results?.length ? [...schemaVersions.results].sort((a, b) => 
      (new Date(b.release_date)).getTime() - (new Date(a.release_date)).getTime()
    ) : [];
  
  const allVersionNumbers = sortedVersions.map(schema => schema.version)
  const selectedVersion = sortedVersions[sortedVersions.findIndex(schema => schema.version === currentVersionNumber)]

  useEffect(() => {
    if (sortedVersions.length > 0 && !currentVersionNumber) {
      setCurrentVersionNumber(sortedVersions[0].version);
    }
  }, [sortedVersions, currentVersionNumber]);

  const { data: schemaJson, isFetching: isFetching } = useSchemaByVersion(namespace, name, currentVersionNumber);

  const { formState, watch, reset, control, setValue, getValues } = useForm<FormFields>({
    defaultValues: {
      schema: {},
    },
  });

  useEffect(() => {
    if (schemaJson) {
      currentSchemaRef.current = schemaJson;
      setValue('schema', schemaJson, { shouldDirty: false });
    }
  }, [schemaJson, setValue]);

  const handleDiscard = () => {
    reset({ schema: currentSchemaRef.current });
  };

  // useEffect(() => {
  //   const os = getOS();
  //   const handleSave = (e: KeyboardEvent) => {
  //     const ctrlKey = os === 'Mac OS' ? e.metaKey : e.ctrlKey;
  //     if (ctrlKey && e.key === 's') {
  //       e.preventDefault();
  //     }
  //   };
  //   window.addEventListener('keydown', handleSave);
  //   return () => {
  //     window.removeEventListener('keydown', handleSave);
  //   };
  // });

  return (
    <div className='container-fluid'>
      <div className='row'>
        <div className="d-flex align-items-center justify-content-between px-3">
          <SchemaHeader
            key={schemaData?.description}
            handleDiscard={handleDiscard}
            isDirty={formState.isDirty}
          />
        </div>
        <div className='col-9 pe-1'>
          <div className="card rounded-2 m-3 mt-0 shadow-sm">
            <div className="card-header fw-semibold text-sm d-flex align-items-center justify-content-between">
              Config (JSON)
              {user && (user.login === namespace || user.orgs.includes(namespace || 'NONE')) && (
                <>
                  <button disabled={!formState.isDirty} onClick={() => setShowSchemaVersionModal(true)} className="btn btn-xs btn-success ms-auto">
                    Save
                  </button>
                  <button disabled={!formState.isDirty} onClick={handleDiscard} className="btn btn-xs btn-outline-dark ms-1">
                    Discard
                  </button>
                </>
              )}
            </div>
            <div className='card-body py-2'>
              {schemaJson && 
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
              }
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
            currentVersion={currentVersionNumber}
            setCurrentVersionNumber={setCurrentVersionNumber}
            allVersionNumbers={allVersionNumbers}
            tags={selectedVersion?.tags}
          />
        </div>
      </div>

      <VersionSchemaModal
        namespace={namespace}
        name={name}
        tags={selectedVersion?.tags}
        schemaJson={getValues('schema')}
        contributors={selectedVersion?.contributors}
        show={showSchemaVersionModal}
        onHide={() => setShowSchemaVersionModal(false)}
      />
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
    </div>
  );
};
