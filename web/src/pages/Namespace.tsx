import { Fragment, useState } from 'react';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { useParams, useSearchParams } from 'react-router-dom';

import { GitHubAvatar } from '../components/badges/github-avatar';
import { PageLayout } from '../components/layout/page-layout';
import { Pagination } from '../components/layout/pagination';
import { AddPEPModal } from '../components/modals/add-pep';
import { DeveloperSettingsModal } from '../components/modals/developer-settings-modal';
import { DownloadGeo } from '../components/namespace/archive/download-geo';
import { NamespaceAPIEndpointsModal } from '../components/modals/namespace-api-endpoints';
import { NamespaceBadge } from '../components/namespace/namespace-badge';
import { NamespacePagePlaceholder } from '../components/namespace/namespace-page-placeholder';
import { ProjectCard } from '../components/namespace/project-cards/project-card';
import { NamespacePageSearchBar } from '../components/namespace/search-bar';
import { StarFilterBar } from '../components/namespace/star-filter-bar';
import { NamespaceViewSelector } from '../components/namespace/view-selector';
import { ProjectListPlaceholder } from '../components/placeholders/project-list';
import { SchemaListCard } from '../components/schemas/schema-list-card';
import { SchemaListSearchBar } from '../components/schemas/schema-list-search-bar';
import { useSession } from '../contexts/session-context';
import { useNamespaceProjects } from '../hooks/queries/useNamespaceProjects';
import { useNamespaceSchemas } from '../hooks/queries/useNamespaceSchemas';
import { useNamespaceStars } from '../hooks/queries/useNamespaceStars';
import { useDebounce } from '../hooks/useDebounce';
import { numberWithCommas } from '../utils/etc';

type View = 'peps' | 'pops' | 'schemas' | 'stars' | 'archive';

export const NamespacePage = () => {
  const [searchParams] = useSearchParams();
  const viewFromUrl = searchParams.get('view') as View;

  // get namespace from url
  let { namespace } = useParams();
  namespace = namespace?.toLowerCase();

  // get session info
  const { user } = useSession();

  // pagination for projects
  const [limit, setLimit] = useState(searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10);
  const [offset, setOffset] = useState(searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [orderBy, setOrderBy] = useState(searchParams.get('orderBy') || 'update_date');
  const [order, setOrder] = useState(searchParams.get('order') || 'asc');

  // pagination for schemas
  const [schemaLimit, setSchemaLimit] = useState(
    searchParams.get('schemaLimit') ? parseInt(searchParams.get('schemaLimit')!) : 10,
  );
  const [schemaOffset, setSchemaOffset] = useState(
    searchParams.get('schemaOffset') ? parseInt(searchParams.get('schemaOffset')!) : 0,
  );
  const [schemaSearch, setSchemaSearch] = useState<string>(searchParams.get('schemaSearch') || '');
  const [schemaOrderBy, setSchemaOrderBy] = useState(searchParams.get('schemaOrderBy') || 'name');
  const [schemaOrder, setSchemaOrder] = useState(searchParams.get('schemaOrder') || 'asc');

  // state
  const [showAddPEPModal, setShowAddPEPModal] = useState(false);
  const [showEndpointsModal, setShowEndpointsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [view, setView] = useState<View>(viewFromUrl || 'peps');
  const [starSearch, setStarSearch] = useState<string>(searchParams.get('starSearch') || '');

  const searchDebounced = useDebounce<string>(search, 500);
  const schemaSearchDebounced = useDebounce<string>(schemaSearch, 500);

  // data fetching
  const {
    // data: namespaceInfo,
    isLoading: namespaceInfoIsLoading,
    error,
  } = useNamespaceProjects(namespace, {
    limit: 0,
  });
  const { data: popsInfo } = useNamespaceProjects(namespace, { type: 'pop', limit: 0 });
  const { data: pepsInfo } = useNamespaceProjects(namespace, { type: 'pep', limit: 0 });
  const { data: projects, isLoading: projectsIsLoading } = useNamespaceProjects(namespace, {
    limit,
    offset,
    orderBy,
    // @ts-ignore - just for now, I know this will work fine
    order: order || 'asc',
    search: searchDebounced,
    type: view === 'pops' ? 'pop' : 'pep',
  });

  const { data: schemas } = useNamespaceSchemas(namespace, {
    limit: schemaLimit,
    offset: schemaOffset,
    orderBy: schemaOrderBy,
    // @ts-ignore - just for now, I know this will work fine
    order: schemaOrder,
    search: schemaSearchDebounced,
  });

  const { data: stars, isLoading: starsAreLoading } = useNamespaceStars(namespace!, {}, namespace === user?.login); // only fetch stars if the namespace is the user's

  // left over from when we were filtering on sample number
  const projectsFiltered = projects?.results?.filter((p) => p.number_of_samples) || [];

  // filter schemas by search
  const schemasFiltered =
    schemas?.results.filter((s) => s.name.toLowerCase().includes(schemaSearch.toLowerCase())) || [];

  if (namespaceInfoIsLoading || starsAreLoading) {
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
        <div className="fw-bold mt-3">
          <Breadcrumb>
            <Breadcrumb.Item className='text-dark' href="/">home</Breadcrumb.Item>
            <Breadcrumb.Item active>{namespace}</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <div className="flex-row d-flex align-items-start justify-content-between">
          <h1 id="namespace-header" className="fw-bold">
            <GitHubAvatar namespace={namespace} height={60} width={60} /> {namespace}
          </h1>
          <div className="d-flex flex-row align-items-center gap-1">
            <button onClick={() => setShowEndpointsModal(true)} className="btn btn-sm btn-outline-dark">
              <i className="bi bi-hdd-rack me-1"></i>
              API
            </button>
            {user?.login === namespace && (
              <button className="btn btn-sm btn-dark" onClick={() => setShowSettingsModal(true)}>
                <i className="bi bi-gear me-1"></i>
                Settings
              </button>
            )}
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
        {namespace !== user?.login && user?.orgs && user?.orgs.some(org => org === namespace) && (
          <>
            <p className="mb-0">
              <span className="fw-bold d-flex">
                You belong to this organization. 
              </span>
            </p>
            <p>
              <span className="fw-bold d-flex">
                Organizations you belong to:
                <div className="d-flex align-items-center">
                  {user?.orgs.map((org) => (
                    <Fragment key={org}>
                      <a className="dark-link" style={{marginLeft: '0'}} href={`/${org}`}>
                        <NamespaceBadge className="me-1" namespace={org} />
                      </a>
                    </Fragment>
                  ))}
                </div>
              </span>
            </p>
          </>
        )}
        {namespace === user?.login && user?.orgs && user.orgs.length > 0 && (
          <>
            <p className="mb-0">
              <span className="fw-bold d-flex">
                Organizations you belong to:
                <div className="d-flex align-items-center">
                  {user?.orgs.map((org) => (
                    <Fragment key={org}>
                      <a className="dark-link" style={{marginLeft: '0'}} href={`/${org}`}>
                        <NamespaceBadge className="me-1" namespace={org} />
                      </a>
                    </Fragment>
                  ))}
                </div>
              </span>
            </p>
          {/*<p className="mb-0">*/}
          {/*  <span className="fw-bold">Total projects: {numberWithCommas(namespaceInfo?.count || 0)}</span>{' '}*/}
          {/*</p>*/}
          {/*<p className="mb-0">*/}
          {/*  <span className="fw-bold">Total schemas: {numberWithCommas(schemas?.count || 0)}</span>{' '}*/}
          {/*</p>*/}
          </>
        )}
        <div className="mt-3 d-flex">
          <NamespaceViewSelector
            numPeps={pepsInfo?.count || 0}
            numPops={popsInfo?.count || 0}
            numStars={stars?.length || 0}
            numSchemas={schemas?.count || 0}
            view={view}
            setView={setView}
            enableStars={namespace === user?.login}
            isGEO={namespace === 'geo'}
            namespace={namespace}
          />
        </div>
        <div className="my-1 border-bottom border-grey"></div>
        {/* Render projects  in namespace */}
        {['peps', 'pops'].includes(view) ? (
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
              setOffset={setOffset}
            />
            <div className="my-3"></div>
            <div className="mt-3">
              {projectsIsLoading || projects === undefined ? (
                <ProjectListPlaceholder />
              ) : projectsFiltered.length === 0 ? (
                <div>
                  {projectsFiltered.length === 0 ? (
                    <div className="text-center">
                      <p className="text-muted">No projects found</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                projectsFiltered.map((project, i) => <ProjectCard key={i} project={project} />)
              )}
              <Fragment>
                {/* pagination */}
                {projects?.count && projects?.count > limit ? (
                  <Pagination limit={limit} offset={offset} count={projects.count} setOffset={setOffset} />
                ) : null}
              </Fragment>
            </div>
          </Fragment>
        ) : view === 'schemas' ? (
          <Fragment>
            <div className="mt-3">
              <SchemaListSearchBar
                limit={schemaLimit}
                namespace={namespace || ''}
                orderBy={schemaOrderBy}
                order={schemaOrder}
                setLimit={setSchemaLimit}
                setOffset={setSchemaOffset}
                setOrderBy={setSchemaOrderBy}
                setOrder={setSchemaOrder}
                search={schemaSearch}
                setSearch={setSchemaSearch}
              />
              {schemasFiltered?.length === 0 ? (
                <div className="text-center mt-5">
                  <p className="fst-italic text-muted">No schemas found.</p>
                </div>
              ) : (
                schemasFiltered.map((s) => <SchemaListCard key={s.name} schema={s} />)
              )}
              {schemas?.count && schemas?.count > schemaLimit ? (
                <Pagination
                  limit={schemaLimit}
                  offset={schemaOffset}
                  count={schemas?.count || 0}
                  setOffset={setSchemaOffset}
                />
              ) : null}
            </div>
          </Fragment>
        ) : view === 'stars' ? (
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
                      star.description?.toLowerCase().includes(starSearch.toLowerCase()) ||
                      star.name?.toLowerCase().includes(starSearch.toLowerCase()),
                  )
                  .map((star) => (
                    <ProjectCard key={star.digest} project={star} />
                  ))}
              </div>
            )}
          </Fragment>
        ) : (view === 'archive' && namespace === 'geo') ? (
          <Fragment>
            <div className="mt-3">
              <DownloadGeo namespace={namespace}/>
            </div>
          </Fragment>
        ) : null
        }
        <AddPEPModal defaultNamespace={namespace} show={showAddPEPModal} onHide={() => setShowAddPEPModal(false)} />
        <NamespaceAPIEndpointsModal
          namespace={namespace || ''}
          show={showEndpointsModal}
          onHide={() => setShowEndpointsModal(false)}
        />
        
        <DeveloperSettingsModal show={showSettingsModal} onHide={() => setShowSettingsModal(false)} />
      </PageLayout>
    );
  }
};
