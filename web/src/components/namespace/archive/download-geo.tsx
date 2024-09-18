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

  return (
    <div className='px-2'>
      <h1 className="fs-5 mb-1 fw-semibold d-inline">Download All GEO Metadata</h1>
      <p className='text-sm mt-1 mb-3'>
        Download all available PEPs for the Gene Expresion Omnibus (GEO). 
        All GEO PEPs are archived quarterly into a single <code>tar</code> file.
        Each archive is slightly over 1 gb in size.
      </p>
      {data ? <NamespaceArchiveTable data={data} /> : 
        <p className='text-center pt-4 fw-semibold'>No archives currently exist for this namespace.</p>
      }
    </div>
  );
};
