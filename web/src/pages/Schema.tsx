import { Editor } from '@monaco-editor/react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';

import { PageLayout } from '../components/layout/page-layout';
import { SchemaInterface } from '../components/schemas/schema-interface';
import { useSession } from '../contexts/session-context';
import { useSchema } from '../hooks/queries/useSchema';
import { useSchemaVersions } from '../hooks/queries/useSchemaVersions';

export function Schema() {
  const { user } = useSession();
  const { namespace, schema } = useParams();
  const { data: schemaData, isFetching: isLoading } = useSchema(namespace, schema);

  const { data: schemaVersions } = useSchemaVersions(namespace, schema);

  const {} = useForm();

  const canEdit = (user && (user.login === namespace || user.orgs.includes(namespace || 'NONE'))) || false;

  return (
    <PageLayout title={`${namespace}/${schema} schema`} fullWidth footer={false} >
      <SchemaInterface
        namespace={namespace!}
        name={schema!}
        key={schemaData?.schema || 'NONE'}
        canEdit={canEdit}
        schemaData={schemaData}
        schemaVersions={schemaVersions}
      />
    </PageLayout>
  );
}
