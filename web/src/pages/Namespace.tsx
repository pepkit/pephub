import { FC, useState } from 'react';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { useParams } from 'react-router-dom';

import { PageLayout } from '../components/layout/page-layout';
import { Pagination } from '../components/layout/pagination';
import { AddPEPModal } from '../components/modals/add-pep';
import { NamespaceAPIEndpointsModal } from '../components/modals/namespace-api-endpoints';
import { NamespacePageSearchBar } from '../components/namespace/search-bar';
import { NamespaceInfoPlaceholder } from '../components/placeholders/namespace-info';
import { ProjectListPlaceholder } from '../components/placeholders/project-list';
import { ProjectCard } from '../components/project/project-card';
import { useNamespaceInfo } from '../hooks/queries/useNamespaceInfo';
import { useNamespaceProjects } from '../hooks/queries/useNamespaceProjects';
import { useDebounce } from '../hooks/useDebounce';
import { useSession } from '../hooks/useSession';
import { numberWithCommas } from '../utils/etc';

export const NamespacePage: FC = () => {
  // get namespace from url
  let { namespace } = useParams();
  namespace = namespace?.toLowerCase();

  // get session info
  const { user, jwt } = useSession();

  // pagination
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState('update_date');
  const [order, setOrder] = useState('asc');

  const searchDebounced = useDebounce<string>(search, 500);

  // data fetching
  const { data: _, isLoading: namespaceInfoIsLoading, error } = useNamespaceInfo(namespace, jwt);
  const { data: projects, isLoading: projectsIsLoading } = useNamespaceProjects(namespace, jwt, {
    limit,
    offset,
    orderBy,
    // @ts-ignore - just for now, I know this will work fine
    order: order || 'asc',
    search: searchDebounced,
  });

  // state
  const [showAddPEPModal, setShowAddPEPModal] = useState(false);
  const [showEndpointsModal, setShowEndpointsModal] = useState(false);

  // fetcing error almost always means the namespace doesn't exist
  if (error) {
    return (
      <PageLayout title={namespace}>
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
          <h1 className="fw-bold">Error occured!</h1>
          <p className="text-muted fst-italic">An error occured fetching the namespace... Are you sure it exists?</p>
          <div>
            <a href="/">
              <button className="btn btn-dark">Take me home</button>
            </a>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={namespace}>
      {/* breadcrumbs */}
      <div className="fw-bold mt-2">
        <Breadcrumb>
          <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
          <Breadcrumb.Item active>{namespace}</Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <div className="flex-row d-flex align-items-start justify-content-between">
        <h1 id="namespace-header" className="fw-bold">
          {namespace}
        </h1>
        <div className="d-flex flex-row align-items-center">
          <button onClick={() => setShowEndpointsModal(true)} className="btn btn-sm btn-outline-dark me-1">
            <i className="bi bi-hdd-rack me-1"></i>
            API
          </button>
          {user?.login === namespace && (
            <button
              onClick={() => setShowAddPEPModal(true)}
              className="btn btn-sm btn-success me-1"
              data-bs-toggle="modal"
              data-bs-target="#newProject"
            >
              <i className="bi bi-plus-circle me-1"></i>
              Add PEP
            </button>
          )}
        </div>
      </div>
      {/* Render info about the namespace */}
      {namespaceInfoIsLoading ? (
        <NamespaceInfoPlaceholder />
      ) : (
        <>
          <p className="mb-0">
            <span className="fw-bold">Total projects: {numberWithCommas(projects?.count || 0)}</span>{' '}
          </p>
        </>
      )}
      {/* Render projects  in namespace */}
      <div className="my-2 border-bottom border-secondary"></div>
      <NamespacePageSearchBar
        namespace={namespace || ''}
        search={search}
        setSearch={setSearch}
        limit={limit}
        setLimit={setLimit}
        orderBy={orderBy}
        setOrderBy={setOrderBy}
        order={order}
        setOrder={setOrder}
      />
      <div className="my-2"></div>
      <div className="mt-3">
        {projectsIsLoading || projects === undefined ? (
          <ProjectListPlaceholder />
        ) : (
          projects.items.map((project, i) => <ProjectCard key={i} project={project} />)
        )}
        <>
          {projects?.count && projects?.count > limit ? (
            <Pagination limit={limit} offset={offset} count={projects.count} setOffset={setOffset} />
          ) : null}
        </>
        {/* no projects exists */}
        <div>
          {projects?.items.length === 0 ? (
            <div className="text-center">
              <p className="text-muted">No projects found</p>
            </div>
          ) : null}
        </div>
      </div>
      <AddPEPModal show={showAddPEPModal} onHide={() => setShowAddPEPModal(false)} />
      <NamespaceAPIEndpointsModal
        namespace={namespace || ''}
        show={showEndpointsModal}
        onHide={() => setShowEndpointsModal(false)}
      />
    </PageLayout>
  );
};
