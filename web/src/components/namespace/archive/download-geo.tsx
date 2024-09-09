import { FC, useState, useMemo } from 'react';

import { useNamespaceArchive } from '../../../hooks/queries/useNamespaceArchive'
import { NamespaceArchiveTable } from '../archive/namespace-archive-table'
import { ArchiveItem, ArchiveResponse } from '../../../api/namespace'

interface Props {
  namespace: string | undefined;
}

export const DownloadGeo = (props: Props) => {
  const namespace = props.namespace;

  const {
    isFetching,
    isError,
    error,
    data,
  } = useNamespaceArchive(namespace);

  // console.log(data)

  // let testData = {
  //   count: 12,
  //   results: [
  //     {
  //       identifier: 8,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_06.tar",
  //       creation_date: "2024-09-06T17:00:18.3913772",
  //       number_of_projects: 228300,
  //       file_size: 626581571
  //     },
  //     {
  //       identifier: 9,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_07.tar",
  //       creation_date: "2024-09-07T09:30:45.1234567",
  //       number_of_projects: 33000,
  //       file_size: 626581571
  //     },
  //     {
  //       identifier: 1,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_06.tar",
  //       creation_date: "2024-09-06T17:00:18.3913772",
  //       number_of_projects: 228300,
  //       file_size: 626581571
  //     },
  //     {
  //       identifier: 53,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_07.tar",
  //       creation_date: "2024-09-07T09:30:45.1234567",
  //       number_of_projects: 33000,
  //       file_size: 626581571
  //     },{
  //       identifier: 74,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_06.tar",
  //       creation_date: "2024-09-06T17:00:18.3913772",
  //       number_of_projects: 228300,
  //       file_size: 626581571
  //     },
  //     {
  //       identifier: 45,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_07.tar",
  //       creation_date: "2024-09-07T09:30:45.1234567",
  //       number_of_projects: 33000,
  //       file_size: 626581571
  //     },{
  //       identifier: 12,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_06.tar",
  //       creation_date: "2024-09-06T17:00:18.3913772",
  //       number_of_projects: 228300,
  //       file_size: 626581571
  //     },
  //     {
  //       identifier: 60,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_07.tar",
  //       creation_date: "2024-09-07T09:30:45.1234567",
  //       number_of_projects: 33000,
  //       file_size: 626581571
  //     },
  //     {
  //       identifier: 7,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_06.tar",
  //       creation_date: "2024-09-06T17:00:18.3913772",
  //       number_of_projects: 228300,
  //       file_size: 626581571
  //     },
  //     {
  //       identifier: 14,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_07.tar",
  //       creation_date: "2024-09-07T09:30:45.1234567",
  //       number_of_projects: 33000,
  //       file_size: 626581571
  //     },{
  //       identifier: 5,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_06.tar",
  //       creation_date: "2024-09-06T17:00:18.3913772",
  //       number_of_projects: 228300,
  //       file_size: 626581571
  //     },
  //     {
  //       identifier: 3,
  //       namespace: "geo",
  //       file_path: "https://cloud2.databio.org/pephub/geo/geo_2024_09_07.tar",
  //       creation_date: "2024-09-07T09:30:45.1234567",
  //       number_of_projects: 33000,
  //       file_size: 626581571
  //     }
  //   ]
  // };

  // console.log(testData)

  return (
    <div className='px-2'>
      <h1 className="fs-5 mb-1 fw-semibold d-inline">Download All GEO Metadata</h1>
      <p className='text-sm mt-1 mb-3'>
        Download all available PEPs for the Gene Expresion Omnibus (GEO). 
        All GEO PEPs are archived quarterly into a single <code>tar</code> file.
        Each archive is slightly over 1 gb in size.
      </p>
      {data ? <NamespaceArchiveTable data={data} /> : 
        <p className='text-center'>No archives currently exist for this namespace.</p>
      }
    </div>
  );
};
