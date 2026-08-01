import { useNamespaceArchive } from '../../../hooks/queries/useNamespaceArchive'

interface Props {
  namespace: string | undefined;
}

export const DownloadGeoCount = (props: Props) => {
  const namespace = props.namespace;

  const {
    isFetching,
    isError,
    error,
    data,
  } = useNamespaceArchive(namespace);

  if (isFetching) return <span>-</span>;
  if (isError || !data) return <span>0</span>;
  return <span>{data.count}</span>;
};
