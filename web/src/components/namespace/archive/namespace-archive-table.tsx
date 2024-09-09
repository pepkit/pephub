import { FC, useState, useMemo } from 'react';

import { ArchiveItem, ArchiveResponse } from '../../../api/namespace'

interface Props {
  data: ArchiveResponse;
}

const ITEMS_PER_PAGE = 10;

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const NamespaceArchiveTable: React.FC<Props> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ArchiveItem; direction: 'ascending' | 'descending' }>({
    key: 'creation_date',
    direction: 'descending'
  });

  const sortedData = useMemo(() => {
    let sortableItems = [...data.results];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data.results, sortConfig]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return sortedData.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, sortedData]);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);

  const requestSort = (key: keyof ArchiveItem) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortDirection = (name: keyof ArchiveItem) => {
    if (!sortConfig || sortConfig.key !== name) {
      return <i className='bi bi-filter' />;
    }
    return sortConfig.direction === 'ascending' ? <i className='bi bi-caret-up-fill' /> : <i className='bi bi-caret-down-fill' />;
  };

  return (
    <div className="mt-3">
      <label className="fw-semibold">GEO Archives (Total: {data.count})</label>
      <div className="table-responsive">
        <table className="table table-striped table-bordered mt-1">
          <thead className="text-sm">
            <tr>
              <th scope="col" onClick={() => requestSort('namespace')} style={{ cursor: 'pointer' }}>
                Namespace {getSortDirection('namespace')}
              </th>
              <th scope="col" onClick={() => requestSort('number_of_projects')} style={{ cursor: 'pointer' }}>
                Number of Projects {getSortDirection('number_of_projects')}
              </th>
              <th scope="col" onClick={() => requestSort('creation_date')} style={{ cursor: 'pointer' }}>
                Archive Date {getSortDirection('creation_date')}
              </th>
              <th scope="col" onClick={() => requestSort('file_size')} style={{ cursor: 'pointer' }}>
                File Size {getSortDirection('file_size')}
              </th>
              <th scope="col">Download Link</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {currentTableData.map((result) => (
              <tr key={result.identifier}>
                <td>{result.namespace}</td>
                <td>{result.number_of_projects}</td>
                <td>{formatDate(result.creation_date)}</td>
                <td>{(result.file_size / 1024 / 1024 / 1024).toFixed(2)} gb</td>
                <td>
                  <a href={result.file_path} className="btn btn-sm btn-secondary" target="_blank" rel="noopener noreferrer">
                    {result.file_path.split('/').pop()}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <nav aria-label="Page navigation" className="">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                Previous
              </button>
            </li>
            {[...Array(totalPages)].map((_, index) => (
              <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(index + 1)}>
                  {index + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};
