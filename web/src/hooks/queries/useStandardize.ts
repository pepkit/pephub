import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getStandardizedCols, StandardizeColsResponse } from '../../api/project';
import { useSession } from '../../contexts/session-context';

export const useStandardize = (
  namespace: string | undefined,
  project: string | undefined,
  tag: string | undefined,
  schema: string | undefined
): UseQueryResult<StandardizeColsResponse, Error> => {
  const session = useSession();

  const query = useQuery<StandardizeColsResponse, Error>({
    queryKey: [namespace, project, tag],
    queryFn: () => 
      getStandardizedCols(
        namespace || '', 
        project || '', 
        tag || '', // Assuming tag should not be undefined when called
        session?.jwt || null, // Changed to null to match getStandardizedCols signature
        schema || ''
      ),
    enabled: false, // This query should only run on demand (ie. when the user clicks the standardize button)
  });

  return query;
};