import { FC, Fragment, useEffect, useState } from 'react';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { useParams } from 'react-router-dom';

import { GitHubAvatar } from '../components/badges/github-avatar';
import { PageLayout } from '../components/layout/page-layout';
import { Pagination } from '../components/layout/pagination';
import { AddPEPModal } from '../components/modals/add-pep';
import { NamespaceAPIEndpointsModal } from '../components/modals/namespace-api-endpoints';
import { NamespaceBadge } from '../components/namespace/namespace-badge';
import { NamespacePagePlaceholder } from '../components/namespace/namespace-page-placeholder';
import { NamespacePageSearchBar } from '../components/namespace/search-bar';
import { StarFilterBar } from '../components/namespace/star-filter-bar';
import { NamespaceViewSelector } from '../components/namespace/view-selector';
import { ProjectListPlaceholder } from '../components/placeholders/project-list';
import { ProjectCard } from '../components/project/project-card';
import { useNamespaceInfo } from '../hooks/queries/useNamespaceInfo';
import { useNamespaceProjects } from '../hooks/queries/useNamespaceProjects';
import { useNamespaceStars } from '../hooks/queries/useNamespaceStars';
import { useDebounce } from '../hooks/useDebounce';
import { useSession } from '../hooks/useSession';
import { numberWithCommas } from '../utils/etc';

type View = 'peps' | 'stars';

export const NamespacePage: FC = () => {
  // get view out of url its a query param
  const urlParams = new URLSearchParams(window.location.search);
  const viewFromUrl = urlParams.get('view') as View;

  // get namespace from url
  let { namespace } = useParams();
  namespace = namespace?.toLowerCase();

  // get session info
  const { user } = useSession();

  // pagination
  const [limit, setLimit] = useState(urlParams.get('limit') ? parseInt(urlParams.get('limit')!) : 10);
  const [offset, setOffset] = useState(urlParams.get('offset') ? parseInt(urlParams.get('offset')!) : 0);
  const [search, setSearch] = useState(urlParams.get('search') || '');
  const [orderBy, setOrderBy] = useState(urlParams.get('orderBy') || 'update_date');
  const [order, setOrder] = useState(urlParams.get('order') || 'asc');

  const searchDebounced = useDebounce<string>(search, 500);

  // data fetching
  const { data: namespaceInfo, isLoading: namespaceInfoIsLoading, error } = useNamespaceInfo(namespace);
  const { data: projects, isLoading: projectsIsLoading } = useNamespaceProjects(namespace, {
    limit,
    offset,
    orderBy,
    // @ts-ignore - just for now, I know this will work fine
    order: order || 'asc',
    search: searchDebounced,
  });
  const { data: stars, isLoading: starsIsLoading } = useNamespaceStars(namespace, {}, namespace === user?.login); // only fetch stars if the namespace is the user's

  // state
  const [showAddPEPModal, setShowAddPEPModal] = useState(false);
  const [showEndpointsModal, setShowEndpointsModal] = useState(false);
  const [view, setView] = useState<View>(viewFromUrl === 'stars' ? 'stars' : 'peps');
  const [starSearch, setStarSearch] = useState<string>(urlParams.get('starSearch') || '');

  // update url when search changes
  useEffect(() => {
    if (typeof window !== 'undefined' && search === '') {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete('search');
      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    } else if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('search', search);
      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    }
  }, [search]);

  useEffect(() => {
    if (typeof window !== 'undefined' && starSearch === '') {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete('starSearch');
      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    } else if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('starSearch', starSearch);
      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    }
  }, [starSearch]);

  if (namespaceInfoIsLoading || starsIsLoading) {
    return (
      <PageLayout title={namespace}>
        <NamespacePagePlaceholder />
      </PageLayout>
    );
  }

  // fetcing error almost always means the namespace doesn't exist
  else if (error) {
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
  } else {
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
            <GitHubAvatar namespace={namespace} height={60} width={60} /> {namespace}
          </h1>
          <div className="d-flex flex-row align-items-center">
            <button onClick={() => setShowEndpointsModal(true)} className="btn btn-sm btn-outline-dark me-1">
              <i className="bi bi-hdd-rack me-1"></i>
              API
            </button>
            {user?.login === namespace || user?.orgs.includes(namespace || '') ? (
              <Fragment>
                <button
                  onClick={() => setShowAddPEPModal(true)}
                  className="btn btn-sm btn-success me-1"
                  data-bs-toggle="modal"
                  data-bs-target="#newProject"
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Add
                </button>
              </Fragment>
            ) : null}
          </div>
        </div>
        <>
          {namespace === user?.login && user?.orgs && user.orgs.length > 0 && (
            <p className="mb-0">
              <span className="fw-bold d-flex">
                Organizations you belong to:{' '}
                <div className="d-flex align-items-center">
                  {user?.orgs.map((org) => (
                    <Fragment key={org}>
                      <a className="ms-1 text-decoration-none" href={`/${org}`}>
                        <NamespaceBadge className="me-1" namespace={org} />
                      </a>{' '}
                    </Fragment>
                  ))}
                </div>
              </span>
            </p>
          )}
          <p className="mb-0">
            <span className="fw-bold">Total projects: {numberWithCommas(namespaceInfo?.number_of_projects || 0)}</span>{' '}
          </p>
        </>
        {user && namespace === user?.login ? (
          <div className="mt-3">
            <NamespaceViewSelector
              numPeps={projects?.count || 0}
              numStars={stars?.length || 0}
              view={view}
              setView={setView}
            />
            <div className="my-1 border-bottom border-grey"></div>
          </div>
        ) : (
          <div className="my-3 border-bottom border-grey"></div>
        )}
        {/* Render projects  in namespace */}

        {view === 'peps' ? (
          <Fragment>
            <div className="mt-3"></div>
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
            <div className="my-3"></div>
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
          </Fragment>
        ) : (
          // render stars in namespace
          <Fragment>
            {stars?.length === 0 ? (
              <div className="text-center mt-5">
                <p className="fst-italic text-muted">No stars found. Star some projects and they will show up here!</p>
                <i className="text-muted text-4xl bi bi-stars mt-4"></i>
              </div>
            ) : (
              <div className="mt-3">
                <StarFilterBar search={starSearch} setSearch={setStarSearch} />
                {stars
                  ?.filter(
                    (star) =>
                      star.description.toLowerCase().includes(starSearch.toLowerCase()) ||
                      star.name.toLowerCase().includes(starSearch.toLowerCase()),
                  )
                  .map((star) => (
                    <ProjectCard key={star.digest} project={star} />
                  ))}
              </div>
            )}
          </Fragment>
        )}
        <AddPEPModal defaultNamespace={namespace} show={showAddPEPModal} onHide={() => setShowAddPEPModal(false)} />
        <NamespaceAPIEndpointsModal
          namespace={namespace || ''}
          show={showEndpointsModal}
          onHide={() => setShowEndpointsModal(false)}
        />
      </PageLayout>
    );
  }
};
