import { useState, useRef } from 'react';
import Nav from 'react-bootstrap/Nav';
import { NavLink, useParams, useSearchParams } from 'react-router-dom';

import { PageLayout } from '../components/layout/page-layout';
import { CreateSchemaModal } from '../components/modals/create-schema-modal';
import { SchemasPagePlaceholder } from '../components/schemas/placeholders/schemas-page-placeholder';
import { SchemaCard } from '../components/schemas/schema-card';
import { SchemasNav } from '../components/schemas/schemas-nav';
import { useAllSchemas } from '../hooks/queries/useAllSchemas';
import { useDebounce } from '../hooks/useDebounce';
import { useBiggestNamespace } from '../hooks/queries/useBiggestNamespace';
import { useNamespaceProjects } from '../hooks/queries/useNamespaceProjects';
import { LoadingSpinner } from '../components/spinners/loading-spinner';
import { Markdown } from '../components/markdown/render';
import { ProjectAccordion } from '../components/browse/project-accordion'
import { NamespaceLongRow } from '../components/browse/namespace-long-row'

type View = 'peps' | 'schemas';

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

export function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewFromUrl = searchParams.get('view') as View;

  const [view, setView] = useState<View>(viewFromUrl || 'peps');

  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState('update_date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateSchemaModal, setShowCreateSchemaModal] = useState(false);
  const [selectedNamespace, setSelectedNamespace] = useState<string | undefined>(undefined);

  const searchDebounced = useDebounce(search, 500);

  const namespaces = useBiggestNamespace(25);
  const topNamespace = useNamespaceProjects(selectedNamespace, {
    limit: 10,
    offset: 0,
    orderBy: 'stars',
    // orderBy: 'update_date',
    order: 'desc',
    search: '',
    type: 'pep',
  });
  
  const handleSelectNamespace = (selectedNamespace: string) => {
    setSelectedNamespace((prevSelectedNamespace: string | undefined) => 
      prevSelectedNamespace === selectedNamespace ? undefined : selectedNamespace
    );
  }

  const handleNavSelect = (eventKey: string | null) => {
    if (eventKey === null) {
      return;
    }
    searchParams.set('view', eventKey);
    setSearchParams(searchParams);
    setView(eventKey as View);
  };

  const {
    data: schemas,
    isFetching: isLoading,
    error,
  } = useAllSchemas({
    limit,
    offset,
    search: searchDebounced,
    order,
    orderBy,
  });

  const noSchemasInDatabase = schemas?.count === 0;

  if (isLoading) {
    return (
      <PageLayout title="Browse">
        <div className="w-100">
          <SchemasPagePlaceholder />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Browse">
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

  const renderRow = (startIndex: number, endIndex: number) => (
    <div className='row mb-4'>
      <div className='col-1'></div>
      {namespaces?.data?.results ? (
        Object.values(namespaces.data.results)
          .slice(startIndex, endIndex)
          .map((item, index: number) => (
            <div key={startIndex + index} className="col-2">
              <div className={`card shadow-sm position-relative cursor-pointer ${item?.namespace === selectedNamespace ? 'bg-primary-subtle' : 'bg-body-tertiary namespace-card'}`}>
                <div className="card-body text-center">
                  <p className={`card-title mt-2 text-primary-emphasis ${item?.namespace === selectedNamespace ? 'fw-bold' : 'fw-semibold'}`}>
                    <a className='text-decoration-none text-reset stretched-link' onClick={() => handleSelectNamespace(item?.namespace)}>
                      {startIndex + index + 1}. {item?.namespace}
                    </a>
                  </p>
                  <p className={`card-text mb-2 text-sm ${item?.namespace === selectedNamespace ? 'fw-medium' : 'fw-normal'}`}>
                    {item?.number_of_projects} Projects
                  </p>
                </div>
              </div>
            </div>
          ))
      ) : null}
      <div className='col-1'></div>
    </div>
  );

  const renderNamespaceGrid = () => (
    <div className="row mt-1">
      <div className="col-12 col-lg-10 offset-lg-1">
        <div className="row row-cols-1 row-cols-sm-3 row-cols-xl-5 g-lg-4 g-3">
          {namespaces?.data?.results ? 
            Object.values(namespaces.data.results).map((item, index: number) => (
              <div key={index} className="col">
                <div className={`card h-100 shadow-sm position-relative cursor-pointer ${item?.namespace === selectedNamespace ? 'bg-primary-subtle' : 'bg-body-tertiary namespace-card'}`}>
                  <div className="card-body text-center d-flex flex-column justify-content-center">
                    <p className={`card-title mt-2 text-primary-emphasis ${item?.namespace === selectedNamespace ? 'fw-bold' : 'fw-semibold'}`}>
                      <a className='text-decoration-none text-reset stretched-link' onClick={() => handleSelectNamespace(item?.namespace)}>
                        {index + 1}. {item?.namespace}
                      </a>
                    </p>
                    <p className={`card-text mb-2 text-sm ${item?.namespace === selectedNamespace ? 'fw-medium' : 'fw-normal'}`}>
                      {item?.number_of_projects} Projects
                    </p>
                  </div>
                </div>
              </div>
            ))
          : null}
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout title="Browse">
      <div className="p-2">
        <div className="px-0 py-1 modal-pill col-lg-6 col-md-9 col-sm-12 mx-auto">
          <Nav 
            variant="pills" 
            justify
            defaultActiveKey={view} 
            onSelect={handleNavSelect}
            className='border border-2 border-light-subtle rounded rounded-3 bg-body-secondary mt-3 w-100 mx-auto' 
          >
            <Nav.Item>
              <Nav.Link eventKey="peps" className="px-2 py-1 me-1">
                <i className="bi bi-people-fill me-1"></i>
                Popular PEPs
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="schemas" className="px-2 py-1 me-1">
                <i className="bi bi-file-earmark-check me-1"></i>
                Schemas
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>

        {view === 'peps' ?
          <>
            <div className='row mt-4'>
              {selectedNamespace === undefined ? 
                <div className='col-12'>
                  {renderNamespaceGrid()}
                </div>
                : 
                <div className='mt-1 mb-3'>
                  <NamespaceLongRow
                    namespaces={namespaces?.data?.results}
                    selectedNamespace={selectedNamespace}
                    handleSelectNamespace={handleSelectNamespace}
                  />
                </div>
              }
            </div>

            <div className='row mt-0'>
              <div className='col-12'>
                {topNamespace?.data?.results ? 
                  <>
                    <div className='d-flex flex-wrap align-items-center justify-content-between'>
                      <div className='fs-6 fw-medium pt-3'>
                        Top 10 Starred PEPs
                      </div>
                      <a
                        className='fs-6 fw-medium shadow-sm btn btn-outline-dark mt-2 mt-sm-0'
                        href={`${selectedNamespace}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit {selectedNamespace} <i className='bi bi-caret-right-fill'/>
                      </a>
                    </div>
                    <ProjectAccordion projects={topNamespace?.data?.results} />
                    <p className='text-sm fw-medium text-center mt-2'>Want to see more? Visit the namespace to view remaining projects.</p>
                  </>
                : selectedNamespace ?
                <div className='col-12 mt-4 text-center'>
                  <LoadingSpinner />
                </div>
                : null
                }
              </div>
            </div>
          </>
          : 
          <div className="mt-2">
            <SchemasNav
              limit={limit}
              setLimit={setLimit}
              offset={offset}
              setOffset={setOffset}
              orderBy={orderBy}
              setOrderBy={setOrderBy}
              order={order}
              setOrder={setOrder}
              search={search}
              setSearch={setSearch}
              setCreateModalOpen={setShowCreateSchemaModal}
            />
            <div className="d-flex flex-col align-items-center">
              {noSchemasInDatabase ? (
                <NoSchemas />
              ) : (
                <div className="schemas-grid w-100 py-2">
                  {schemas?.results.map((s, i) => (
                    <SchemaCard key={`${i}-${s.namespace}/${s.name}`} schema={s} />
                  ))}
                </div>
              )}
            </div>
          </div>
        }

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
