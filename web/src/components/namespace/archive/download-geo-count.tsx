import { FC, useState, useMemo } from 'react';

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

  return (
    <span>{data ? data.count : 0}</span>
  );
};
