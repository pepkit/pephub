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

type View = 'namespaces' | 'schemas';

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

  const [view, setView] = useState<View>(viewFromUrl || 'namespaces');


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
    orderBy: 'update_date',
    // @ts-ignore - just for now, I know this will work fine
    order: 'asc',
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

  const renderLongRow = () => (
    <div className="position-relative">
      <div 
        // ref={containerRef}
        className="row flex-nowrap overflow-auto py-4" 
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {namespaces?.data?.results ? (
          Object.values(namespaces.data.results).map((item, index) => (
             <div 
              key={index} 
              // ref={el => itemRefs.current[item.namespace] = el}
              className="col-2 flex-shrink-0" 
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className={`card shadow-sm position-relative cursor-pointer ${item?.namespace === selectedNamespace ? 'bg-primary-subtle' : 'bg-body-tertiary namespace-card'}`}>
                <div className="card-body text-center px-0">
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
        ) : null}
      </div>
    </div>
  )

  return (
    <PageLayout title="Browse">
      <div className="p-2">


        <div className="px-0 py-1 modal-pill">
          <Nav 
            variant="pills" 
            justify
            defaultActiveKey={view} 
            onSelect={handleNavSelect}
            className='border border-2 border-light-subtle rounded rounded-3 bg-body-secondary mt-3 w-50 mx-auto' 
          >
            <Nav.Item>
              <Nav.Link eventKey="namespaces" className="px-2 py-1 me-1">
                <i className="bi bi-people-fill me-1"></i>
                Popular Namespaces
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

        {view === 'namespaces' ?
          <>
            <div className='row my-4'>
              <div className='col-1'></div>
              {selectedNamespace === undefined ? 
                <div className='mt-2'>
                  {renderRow(0, 5)}
                  {renderRow(5, 10)}
                  {renderRow(10, 15)}
                  {renderRow(15, 20)}
                  {renderRow(20, 25)}
                </div>
                : 
                <div className='mt-1'>
                  <NamespaceLongRow
                    namespaces={namespaces?.data?.results}
                    selectedNamespace={selectedNamespace}
                    handleSelectNamespace={handleSelectNamespace}
                  />
                </div>
              }
              <div className='col-1'></div>
            </div>

            <div className='row mt-0'>
              {topNamespace?.data?.results ? <ProjectAccordion projects={topNamespace?.data?.results} />
              : selectedNamespace ?
              <div className='col-12 mt-4 text-center'>
                <LoadingSpinner />
              </div>
              : null
              }
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
