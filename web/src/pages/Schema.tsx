import { Editor } from '@monaco-editor/react';
import { useParams } from 'react-router-dom';

import { PageLayout } from '../components/layout/page-layout';
import { SchemaHeader } from '../components/schemas/schema-header';
import { useSession } from '../contexts/session-context';
import { useSchema } from '../hooks/queries/useSchema';

export function Schema() {
  const { user } = useSession();
  const { namespace, schema } = useParams();
  const { data: schemaData, isFetching: isLoading } = useSchema(namespace, schema);

  const canEdit = (user && (user.login === namespace || user.orgs.includes(namespace || 'NONE'))) || false;

  return (
    <PageLayout title={`${namespace}/${schema} schema`} fullWidth>
      <div className="d-flex align-items-center justify-content-between px-4 border-bottom">
        <SchemaHeader />
      </div>
      <div className="p-2">
        <Editor
          options={{
            readOnly: !canEdit,
          }}
          language={'yaml'}
          defaultLanguage="yaml"
          value={schemaData?.schema}
          loading={null}
          height={'75vh'}
        />
      </div>
    </PageLayout>
  );
}
