import { useQuery } from '@tanstack/react-query';

import { getApiBase } from '../../api/server';

export const useApiBase = () => {
  const query = useQuery({
    queryKey: ['apiBase'],
    queryFn: getApiBase,
  });
  return query;
};
