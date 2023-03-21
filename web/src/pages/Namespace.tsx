import { FC } from 'react';
import useSWR, { Fetcher } from 'swr';
import { useParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/page-layout';
import { getNamespaceInfo, getNamespaceProjects, NamespaceProjectsResponse, NamespaceResponse } from '../api/namespace';

// data fetchers
const namespaceFetcher: Fetcher<NamespaceResponse, string> = (namespace) => getNamespaceInfo(namespace);
const projectsFetcher: Fetcher<NamespaceProjectsResponse, string> = (namespace) => getNamespaceProjects(namespace);

export const NamespacePage: FC = () => {
  // get namespace from url
  const { namespace } = useParams();

  // data fetching
  const { data: namespaceInfo, isLoading: namespaceInfoIsLoading } = useSWR(
    namespace ? `${namespace}-info` : null,
    () => namespaceFetcher(namespace || ''),
  );
  const { data: projects, isLoading: projectsIsLoading } = useSWR(namespace ? `${namespace}-projects` : null, () =>
    projectsFetcher(namespace || ''),
  );

  return (
    <PageLayout title={namespace}>
      <h1>Namespace Page</h1>
      <p>Namespace: {namespace}</p>
      <div>
        {namespaceInfoIsLoading ? (
          <p>Loading...</p>
        ) : (
          <code>
            <pre>{JSON.stringify(namespaceInfo, null, 2)}</pre>
          </code>
        )}
      </div>
      <div className="mt-3">
        {projectsIsLoading || projects === undefined ? (
          <p>Loading...</p>
        ) : (
          projects.items.map((project) => (
            <div key={project.name}>
              <a href={`${namespace}/${project.name}`}>{`${namespace}/${project.name}`}</a>
            </div>
          ))
        )}
      </div>
    </PageLayout>
  );
};
