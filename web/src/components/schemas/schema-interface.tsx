import { Editor } from '@monaco-editor/react';
import { Controller, useForm } from 'react-hook-form';
import { Fragment } from 'react/jsx-runtime';

import { useEditSchemaMutation } from '../../hooks/mutations/useEditSchemaMutation';
import { useSchema } from '../../hooks/queries/useSchema';
import { SchemaHeader } from './schema-header';

type FormFields = {
  schema: string;
};

type Props = {
  namespace: string;
  name: string;
  schemaData: ReturnType<typeof useSchema>['data'];
  canEdit: boolean;
};

export const SchemaInterface = (props: Props) => {
  const { schemaData, canEdit, namespace, name } = props;

  const { update, isPending: isUpdating } = useEditSchemaMutation(namespace, name);

  const { formState, watch, reset, control } = useForm<FormFields>({
    defaultValues: {
      schema: schemaData?.schema || '',
    },
  });

  const newSchema = watch('schema');

  const handleSubmit = () => {
    update(newSchema);
  };

  const handleDiscard = () => {
    reset();
  };

  return (
    <Fragment>
      <div className="d-flex align-items-center justify-content-between px-4 border-bottom">
        <SchemaHeader
          isUpdating={isUpdating}
          handleDiscard={handleDiscard}
          handleSave={handleSubmit}
          isDirty={formState.isDirty}
        />
      </div>
      <div className="p-2">
        <Controller
          name="schema"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Editor
              options={{
                readOnly: !canEdit,
              }}
              language={'yaml'}
              defaultLanguage="yaml"
              value={value}
              loading={null}
              height={'75vh'}
              onChange={(v) => {
                onChange(v);
              }}
            />
          )}
        />
      </div>
    </Fragment>
  );
};
