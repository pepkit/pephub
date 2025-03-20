import { Editor } from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { Fragment } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useEditSchemaMutation } from '../../hooks/mutations/useEditSchemaMutation';
import { useSchema } from '../../hooks/queries/useSchema';
// import { useSchemaVersions } from '../../hooks/queries/useSchemaVersions';
import { useSchemaByVersion } from '../../hooks/queries/useSchemaByVersion';
import { getOS } from '../../utils/etc';
import { SchemaHeader } from './schema-header';
import { SchemaSidebar } from './schema-sidebar';

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

  const [currentVersionNumber, setCurrentVersionNumber] = useState('');

  const sortedVersions = schemaVersions?.results?.length 
  ? [...schemaVersions.results].sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
  : [];  
  
  const allVersionNumbers = sortedVersions.map(schema => schema.version)
  const selectedVersion = sortedVersions[sortedVersions.findIndex(schema => schema.version === currentVersionNumber)]

  console.log(schemaData)
  console.log(selectedVersion)

  useEffect(() => {
    if (sortedVersions.length > 0 && !currentVersionNumber) {
      setCurrentVersionNumber(sortedVersions[0].version);
    }
  }, [sortedVersions, currentVersionNumber]);

  const { data: schemaJson, isFetching: isLoading } = useSchemaByVersion(namespace, name, currentVersionNumber);

  


  const { update, isPending: isUpdating } = useEditSchemaMutation(namespace, name);

  const { formState, watch, reset, control, setValue } = useForm<FormFields>({
    defaultValues: {
      schema: {},
    },
  });

  useEffect(() => {
    if (schemaJson) {
      setValue('schema', schemaJson, { shouldDirty: false });
    }
  }, [schemaJson, setValue]);


  const newSchema = watch('schema');

  const handleSubmit = () => {
    update({
      // schema: newSchema,
    });
    // reset();
  };

  const handleDiscard = () => {
    reset();
  };

  useEffect(() => {
    const os = getOS();
    const handleSave = (e: KeyboardEvent) => {
      const ctrlKey = os === 'Mac OS' ? e.metaKey : e.ctrlKey;
      if (ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleSave);
    return () => {
      window.removeEventListener('keydown', handleSave);
    };
  });

  return (
    <Fragment>
      <div className='row px-1'>
        <div className="d-flex align-items-center justify-content-between px-4 mb-">
          <SchemaHeader
            key={schemaData?.description}
            isUpdating={isUpdating}
            handleDiscard={handleDiscard}
            handleSave={handleSubmit}
            isDirty={formState.isDirty}
          />
        </div>
        <div className='col-9 pe-1'>
          <div className="card rounded-2 m-3 mt-0 shadow-sm">
            <div className="card-header fw-semibold text-sm">
              Editor (JSON)
            </div>
            <div className='card-body ps-3 py-2'>
            <Controller
              name="schema"
              control={control}
              render={({ field: { onChange, value } }) => (
                // <Editor
                //   options={{
                //     readOnly: !canEdit,
                //   }}
                //   language={'json'}
                //   defaultLanguage="json"
                //   value={value}
                //   loading={null}
                //   height={'75vh'}
                //   onChange={(v) => {
                //     onChange(v);
                //   }}
                // />
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
                  height={'71vh'}
                />
              )}
            />
            </div>
            
          </div>
        </div>

        <div className='col-3'>
          <SchemaSidebar
            key={schemaData?.description}
            description={schemaData?.description || ''}
            maintainers={schemaData?.maintainers}
            isPrivate={schemaData?.private}
            lifecycleStage={schemaData?.lifecycle_stage}
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
      
    </Fragment>
  );
};
