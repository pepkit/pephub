import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

// pep_schema is stored as "namespace/name" or "namespace/name:version".
// Default version when missing is "latest".
export const parseSchemaRegistryPath = (
  path: string | null | undefined,
): { namespace: string; name: string; version: string } | null => {
  if (!path) return null;
  const [nsAndName, versionPart] = path.split(':');
  if (!nsAndName) return null;
  const [namespace, name] = nsAndName.split('/');
  if (!namespace || !name) return null;
  return { namespace, name, version: versionPart || 'latest' };
};

export const fetchSchemaJson = async (
  namespace: string,
  name: string,
  version: string,
): Promise<object> => {
  const url = `${API_BASE}/schemas/${namespace}/${name}/versions/${version}/file?format=json`;
  const { data } = await axios.get<object>(url);
  return data;
};

export const useSchemaJson = (
  schemaRegistryPath: string | null | undefined,
) => {
  const parsed = parseSchemaRegistryPath(schemaRegistryPath);
  return useQuery({
    queryKey: ['schema-json', parsed?.namespace, parsed?.name, parsed?.version],
    queryFn: () => fetchSchemaJson(parsed!.namespace, parsed!.name, parsed!.version),
    enabled: !!parsed,
    refetchOnWindowFocus: false,
  });
};
