import { Editor } from '@monaco-editor/react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';

import { PageLayout } from '../components/layout/page-layout';
import { SchemaHeader } from '../components/schemas/schema-header';
import { SchemaInterface } from '../components/schemas/schema-interface';
import { useSession } from '../contexts/session-context';
import { useSchema } from '../hooks/queries/useSchema';

export function Schema() {
  const { user } = useSession();
  const { namespace, schema } = useParams();
  const { data: schemaData, isFetching: isLoading } = useSchema(namespace, schema);

  const {} = useForm();

  const canEdit = (user && (user.login === namespace || user.orgs.includes(namespace || 'NONE'))) || false;

  return (
    <PageLayout title={`${namespace}/${schema} schema`} fullWidth>
      <SchemaInterface
        namespace={namespace!}
        name={schema!}
        key={schemaData?.schema || 'NONE'}
        canEdit={canEdit}
        schemaData={schemaData}
      />
    </PageLayout>
  );
}
