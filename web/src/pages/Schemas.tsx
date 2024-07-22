import { useState } from 'react';

import { PageLayout } from '../components/layout/page-layout';
import { CreateSchemaModal } from '../components/modals/create-schema-modal';
import { SchemasPagePlaceholder } from '../components/schemas/placeholders/schemas-page-placeholder';
import { SchemaCard } from '../components/schemas/schema-card';
import { SchemasNav } from '../components/schemas/schemas-nav';
import { useAllSchemas } from '../hooks/queries/useAllSchemas';

const NoSchemas = () => {
  return (
    <div
      style={{
        height: '400px',
      }}
      className="d-flex flex-column align-items-center justify-content-center w-100"
    >
      <p className="text-muted mb-0">No schemas found</p>
      <i className="bi bi-emoji-smile-upside-down text-muted" style={{ fontSize: '2rem' }}></i>
    </div>
  );
};

export function Schemas() {
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [showCreateSchemaModal, setShowCreateSchemaModal] = useState(false);

  const {
    data: schemas,
    isFetching: isLoading,
    error,
  } = useAllSchemas({
    limit,
    offset,
    search,
  });

  const noSchemasInDatabase = schemas?.count === 0;

  if (isLoading) {
    return (
      <PageLayout title="Schemas">
        <div className="w-100">
          <SchemasPagePlaceholder />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Schemas">
        <div className="w-100">
          <div className="alert alert-danger" role="alert">
            Error fetching schemas
          </div>
          <div>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Schemas">
      <div className="p-2">
        <SchemasNav setCreateModalOpen={setShowCreateSchemaModal} />
        <div className="d-flex flex-col align-items-center">
          {noSchemasInDatabase ? (
            <NoSchemas />
          ) : (
            <div className="d-flex flex-wrap my-2 gap-4">
              {schemas?.results.map((s, i) => (
                <SchemaCard key={`${i}-${s.namespace}/${s.name}`} schema={s} />
              ))}
            </div>
          )}
        </div>
      </div>
      <CreateSchemaModal
        show={showCreateSchemaModal}
        onHide={() => {
          setShowCreateSchemaModal(false);
        }}
      />
    </PageLayout>
  );
}
