import React, { createContext, useContext, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const MAX_SAMPLE_COUNT = 25_000;

type ProviderProps = {
  children: React.ReactNode;
};

const ProjectPageContext = createContext<{
  namespace: string;
  projectName: string;
  tag: string;
  shouldFetchSampleTable: boolean;
  forceTraditionalInterface: boolean;
  setForceTraditionalInterface: React.Dispatch<React.SetStateAction<boolean>>;
  MAX_SAMPLE_COUNT: number;
  // @ts-expect-error - its fine to start with undefined
}>(undefined);

export const ProjectPageProvider = ({ children }: ProviderProps) => {
  const [searchParams] = useSearchParams();

  let { namespace, project: projectName } = useParams();
  namespace = namespace?.toLowerCase();

  // check if we have a namespace and project (i.e. landed on /:namespace/:project)
  if (!namespace || !projectName) {
    throw new Error('ProjectPageProvider must be used within a route that has a namespace and project in the URL');
  }

  const tag = searchParams.get('tag') || 'default';

  // GENERAL STATE
  const [forceTraditionalInterface, setForceTraditionalInterface] = useState(false);

  // DECIDE IF WE SHOULD FETCH SAMPLE TABLE
  let shouldFetchSampleTable = true;

  return (
    <ProjectPageContext.Provider
      value={{
        namespace,
        projectName,
        tag,
        shouldFetchSampleTable,
        forceTraditionalInterface,
        setForceTraditionalInterface,
        MAX_SAMPLE_COUNT,
      }}
    >
      {children}
    </ProjectPageContext.Provider>
  );
};

export const useProjectPage = () => {
  const context = useContext(ProjectPageContext);
  if (context === undefined) {
    throw new Error('useProjectPage must be used within a ProjectPageProvider');
  }
  return context;
};
