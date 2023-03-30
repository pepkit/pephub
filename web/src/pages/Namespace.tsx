import { FC, useState } from 'react';
import useSWR, { Fetcher } from 'swr';
import { useParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/page-layout';
import { getNamespaceInfo, getNamespaceProjects, NamespaceProjectsResponse, NamespaceResponse } from '../api/namespace';
import { useSession } from '../hooks/useSession';
import { NamespaceInfoPlaceholder } from '../components/placeholders/namespace-info';
import { ProjectListPlaceholder } from '../components/placeholders/project-list';
import { ProjectCard } from '../components/namespace/project-card';
import { AddPEPModal } from '../components/modals/add-pep';
import { NamespaceAPIEndpointsModal } from '../components/modals/namespace-api-endpoints';

// data fetchers
const namespaceFetcher = (namespace: string, jwt: string | null) => getNamespaceInfo(namespace, jwt);
const projectsFetcher = (namespace: string, jwt: string | null) => getNamespaceProjects(namespace, jwt);

export const NamespacePage: FC = () => {
  // get namespace from url
  const { namespace } = useParams();

  // get session info
  const { user, jwt } = useSession();

  // data fetching
  const { data: namespaceInfo, isLoading: namespaceInfoIsLoading } = useSWR([namespace, jwt], ([namespace, jwt]) =>
    namespaceFetcher(namespace || '', jwt),
  );
  const { data: projects, isLoading: projectsIsLoading } = useSWR(namespace ? `${namespace}-projects` : null, () =>
    projectsFetcher(namespace || '', jwt),
  );

  // state
  const [showAddPEPModal, setShowAddPEPModal] = useState(false);
  const [showEndpointsModal, setShowEndpointsModal] = useState(false);

  return (
    <PageLayout title={namespace}>
      <div className="flex-row d-flex align-items-start justify-content-between">
        <h1 id="namespace-header" className="fw-bold">
          {namespace}
        </h1>
        <div>
          <button onClick={() => setShowEndpointsModal(true)} className="btn btn-outline-primary me-1">
            <i className="bi bi-hdd-rack"></i>
            API Endpoints
          </button>
          {user?.login === namespace ? (
            <button
              onClick={() => setShowAddPEPModal(true)}
              className="btn btn-outline-success me-1"
              data-bs-toggle="modal"
              data-bs-target="#newProject"
            >
              <i className="bi bi-plus-circle"></i>
              Add PEP
            </button>
          ) : null}
        </div>
      </div>
      {/* Render info about the namespace */}
      {namespaceInfoIsLoading ? (
        <NamespaceInfoPlaceholder />
      ) : (
        <>
          <p className="mb-0">
            <span className="fw-bold">Total projects: {namespaceInfo?.number_of_projects}</span>{' '}
          </p>
          <p className="mb-0">
            <span className="fw-bold">Total samples: {namespaceInfo?.number_of_samples}</span>{' '}
          </p>
        </>
      )}
      {/* Render projects  in namespace */}
      <div className="my-2 border-bottom border-secondary"></div>
      <div className="my-2"></div>
      <div className="mt-3">
        {projectsIsLoading || projects === undefined ? (
          <ProjectListPlaceholder />
        ) : (
          projects.items.map((project, i) => <ProjectCard key={i} project={project} />)
        )}
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
