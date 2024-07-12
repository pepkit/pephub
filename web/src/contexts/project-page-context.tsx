import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { useProjectAnnotation } from '../hooks/queries/useProjectAnnotation';
import { useProjectConfig } from '../hooks/queries/useProjectConfig';
import { useProjectViews } from '../hooks/queries/useProjectViews';
import { useSampleTable } from '../hooks/queries/useSampleTable';
import { useSubsampleTable } from '../hooks/queries/useSubsampleTable';
import { useValidation } from '../hooks/queries/useValidation';

const MAX_SAMPLE_COUNT = 25_000;

type ProviderProps = {
  children: React.ReactNode;
};

const ProjectPageContext = createContext<{
  namespace: string;
  projectName: string;
  tag: string;
  projectAnnotationQuery: ReturnType<typeof useProjectAnnotation>;
  sampleTableQuery?: ReturnType<typeof useSampleTable>;
  subSampleTableQuery: ReturnType<typeof useSubsampleTable>;
  projectConfigQuery: ReturnType<typeof useProjectConfig>;
  projectViewsQuery: ReturnType<typeof useProjectViews>;
  projectValidationQuery: ReturnType<typeof useValidation>;
  shouldFetchSampleTable: boolean;
  forceTraditionalInterface: boolean;
  setForceTraditionalInterface: React.Dispatch<React.SetStateAction<boolean>>;
  MAX_SAMPLE_COUNT: number;
  currentHistoryId: number | null;
  setCurrentHistoryId: React.Dispatch<React.SetStateAction<number | null>>;
  // @ts-expect-error - its fine to start with undefined
}>(undefined);

export const ProjectPageProvider = ({ children }: ProviderProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  let { namespace, project: projectName } = useParams();
  namespace = namespace?.toLowerCase();

  // check if we have a namespace and project (i.e. landed on /:namespace/:project)
  if (!namespace || !projectName) {
    throw new Error('ProjectPageProvider must be used within a route that has a namespace and project in the URL');
  }

  const tag = searchParams.get('tag') || 'default';

  // GENERAL STATE
  const [forceTraditionalInterface, setForceTraditionalInterface] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState<number | null>(null);

  // get state
  // PROJECT ANNOTATION
  const projectAnnotationQuery = useProjectAnnotation(namespace, projectName, tag);

  // DECIDE IF WE SHOULD FETCH SAMPLE TABLE
  let shouldFetchSampleTable = false;
  if (projectAnnotationQuery.data?.number_of_samples) {
    shouldFetchSampleTable = projectAnnotationQuery.data.number_of_samples <= MAX_SAMPLE_COUNT;
  }

  // SAMPLE TABLE
  const sampleTableQuery = useSampleTable({
    namespace,
    project: projectName,
    tag,
    enabled: projectAnnotationQuery.data === undefined ? false : shouldFetchSampleTable,
  });

  // SUBSAMPLE TABLE
  const subSampleTableQuery = useSubsampleTable(namespace, projectName, tag);

  // PROJECT CONFIG
  const projectConfigQuery = useProjectConfig(namespace, projectName, tag);

  // PROJECT VIEWS
  const projectViewsQuery = useProjectViews(namespace, projectName, tag);

  // PROJECT VALIDATION
  const projectValidationQuery = useValidation({
    pepRegistry: `${namespace}/${projectName}:${tag}`,
    schema: projectAnnotationQuery.data?.pep_schema || 'pep/2.0.0', // default to basic pep 2.0.0 schema
    schema_registry: projectAnnotationQuery.data?.pep_schema,
    enabled:
      namespace && projectName && tag && projectAnnotationQuery.data === undefined ? false : shouldFetchSampleTable,
  });

  // watch for changes to anything that might need to change search params
  useEffect(() => {
    if (currentHistoryId !== null) {
      searchParams.set('history', currentHistoryId.toString());
      setSearchParams(searchParams);
    } else {
      searchParams.delete('history');
      setSearchParams(searchParams);
    }
  }, [currentHistoryId]);

  return (
    <ProjectPageContext.Provider
      value={{
        namespace,
        projectName,
        tag,
        projectAnnotationQuery,
        sampleTableQuery,
        subSampleTableQuery,
        projectConfigQuery,
        projectViewsQuery,
        projectValidationQuery,
        shouldFetchSampleTable,
        forceTraditionalInterface,
        setForceTraditionalInterface,
        MAX_SAMPLE_COUNT,
        currentHistoryId,
        setCurrentHistoryId,
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
