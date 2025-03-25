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

  const { data: schemaData, isFetching: isFetchingData } = useSchema(namespace, schema);
  const { data: schemaVersions, refetch: refetchSchemaVersions } = useSchemaVersions(namespace, schema);

  const {} = useForm();

  const canEdit = (user && (user.login === namespace || user.orgs.includes(namespace || 'NONE'))) || false;

  return (
    <PageLayout title={`${namespace}/${schema} schema`} fullWidth footer={false} >
      { schemaData ? (
        <SchemaInterface
          namespace={namespace!}
          name={schema!}
          // key={schemaData?.schema || 'NONE'}
          canEdit={canEdit}
          schemaData={schemaData}
          schemaVersions={schemaVersions}
          refetchSchemaVersions={refetchSchemaVersions}
        />
      ) : (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
          <h1 className="fw-bold">Error 😫</h1>
          <p className="text-muted fst-italic">An error occured fetching the schema... Are you sure it exists?</p>
          <div>
            <a href={`/${namespace}?view=schemas`}>
              <button className="btn btn-dark">Take me back</button>
            </a>
          </div>
        </div>
      )}
      
    </PageLayout>
  );
}
