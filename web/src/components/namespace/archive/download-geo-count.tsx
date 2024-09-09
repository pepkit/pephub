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

  // let testData = {
  //   count: 12,
  //   results: [
  //     {
  //       identifier: 8,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_06.tar",
  //       creation_date: "2024-09-06T17:00:18.3913772",
  //       number_of_projects: 228300
  //     },
  //     {
  //       identifier: 9,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_07.tar",
  //       creation_date: "2024-09-07T09:30:45.1234567",
  //       number_of_projects: 33000
  //     },
  //     {
  //       identifier: 1,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_06.tar",
  //       creation_date: "2024-09-06T17:00:18.3913772",
  //       number_of_projects: 228300
  //     },
  //     {
  //       identifier: 53,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_07.tar",
  //       creation_date: "2024-09-07T09:30:45.1234567",
  //       number_of_projects: 33000
  //     },{
  //       identifier: 74,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_06.tar",
  //       creation_date: "2024-09-06T17:00:18.3913772",
  //       number_of_projects: 228300
  //     },
  //     {
  //       identifier: 45,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_07.tar",
  //       creation_date: "2024-09-07T09:30:45.1234567",
  //       number_of_projects: 33000
  //     },{
  //       identifier: 12,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_06.tar",
  //       creation_date: "2024-09-06T17:00:18.3913772",
  //       number_of_projects: 228300
  //     },
  //     {
  //       identifier: 60,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_07.tar",
  //       creation_date: "2024-09-07T09:30:45.1234567",
  //       number_of_projects: 33000
  //     },
  //     {
  //       identifier: 7,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_06.tar",
  //       creation_date: "2024-09-06T17:00:18.3913772",
  //       number_of_projects: 228300
  //     },
  //     {
  //       identifier: 14,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_07.tar",
  //       creation_date: "2024-09-07T09:30:45.1234567",
  //       number_of_projects: 33000
  //     },{
  //       identifier: 5,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_06.tar",
  //       creation_date: "2024-09-06T17:00:18.3913772",
  //       number_of_projects: 228300
  //     },
  //     {
  //       identifier: 3,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_07.tar",
  //       creation_date: "2024-09-07T09:30:45.1234567",
  //       number_of_projects: 33000
  //     }
  //   ]
  // };

  return (
    <span>{data ? data.count : 0}</span>
  );
};
