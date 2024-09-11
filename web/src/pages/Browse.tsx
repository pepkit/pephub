import { useState } from 'react';
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

import 'bootstrap/dist/css/bootstrap.min.css'
import "bootstrap/dist/js/bootstrap.bundle.min.js"

type View = 'namespaces' | 'schemas';

const ProjectAccordion = ({ projects }) => {
  const [openIndex, setOpenIndex] = useState(null);

  // Filter out the 'length' property
  const projectItems = Object.entries(projects).filter(([key]) => key !== 'length');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="accordion" id="projectAccordion">
      {projectItems.map(([key, project], index) => (
        <div className="accordion-item shadow-sm" key={key}>
          <h2 className="accordion-header" id={`heading${key}`}>
            <button
              className={`accordion-button py-2 ${index !== 0 ? 'collapsed' : ''}`}
              type="button"
              data-bs-toggle="collapse"
              data-bs-target={`#collapse${key}`}
              aria-expanded={index === 0 ? 'true' : 'false'}
              aria-controls={`collapse${key}`}
            >
              <span style={{minWidth: '2.5em'}}>{index + 1}.</span>
              <span className='w-75'>{project.namespace}/<span className='fw-semibold'>{project.name}</span>:{project.tag}</span>
              <span style={{marginLeft: '10em', minWidth: '4.5em'}} className='text-center text-sm border border-dark rounded-2 px-2 py-1'>{project.stars_number} Stars</span>
            </button>
          </h2>
          <div
            id={`collapse${key}`}
            className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
            aria-labelledby={`heading${key}`}
            data-bs-parent="#projectAccordion"
          >
            <div className="accordion-body">

              {project.description ? <Markdown>{project.description}</Markdown> : <p className='fst-italic'>No description</p>}
              <p className='m-0 text-sm'><span className='fw-semibold'>Sample Count:</span> {project.number_of_samples}</p>
              <p className='m-0 text-sm'><span className='fw-semibold'>Created:</span> {formatDate(project.submission_date)}</p>
              <p className='m-0 text-sm'><span className='fw-semibold'>Updated:</span> {formatDate(project.last_update_date)}</p>
              
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};


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
  const [selectedNamespace, setSelectedNamespace] = useState(null)

  const searchDebounced = useDebounce(search, 500);

  const namespaces = useBiggestNamespace(10);
  const topNamespace = useNamespaceProjects(selectedNamespace, {
    limit: 10,
    offset: 0,
    orderBy: 'update_date',
    // @ts-ignore - just for now, I know this will work fine
    order: 'asc',
    search: '',
    type: view === 'pep',
  });

  console.log(namespaces?.data?.results[0].namespace)
  
  const handleSelectNamespace = (selectedNamespace) => {
    setSelectedNamespace(prevSelectedNamespace => 
    prevSelectedNamespace === selectedNamespace ? null : selectedNamespace
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

  const renderRow = (startIndex, endIndex) => (
    <div className='row mb-5'>
      <div className='col-1'></div>
      {namespaces?.data?.results ? (
        Object.values(namespaces.data.results)
          .slice(startIndex, endIndex)
          .map((item, index) => (
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
      <div className="row flex-nowrap overflow-auto py-1" style={{ scrollSnapType: 'x mandatory' }}>
        {namespaces?.data?.results ? (
          Object.values(namespaces.data.results).map((item, index) => (
            <div key={index} className="col-2 flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
              <div className={`card shadow-sm position-relative cursor-pointer ${item?.namespace === selectedNamespace ? 'bg-primary-subtle' : 'bg-body-tertiary namespace-card'}`}>
                <div className="card-body text-center">
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
              {selectedNamespace === null ? 
                <div className='mt-5'>
                  {renderRow(0, 5)}
                  {renderRow(5, 10)}
                </div>
                : 
                <div className='mt-1'>
                  {renderLongRow()}
                  <span><i className='bi bi-caret-left-fill'/></span>
                  <span><i className='bi bi-caret-right-fill float-end'/></span>
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
          <div className="mt-4">
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
