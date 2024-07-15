import {
  PaginationState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Fragment, useState } from 'react';

import { useProjectPage } from '../../contexts/project-page-context';
import { useDeleteProjectHistory } from '../../hooks/mutations/useDeleteProjectHistory';
import { useProjectAllHistory } from '../../hooks/queries/useProjectAllHistory';
import { useCurrentHistoryId } from '../../hooks/stores/useCurrentHistoryId';
import { dateStringToDateTime } from '../../utils/dates';

type HistoryUpdate = {
  change_id: number;
  change_date: string;
  user: string;
};

type Props = {
  hideModal: () => void;
};

type HistoryActionsProps = {
  hideModal: () => void;
  historyId: number;
};

const HistoryActions = (props: HistoryActionsProps) => {
  const { historyId, hideModal } = props;

  const { namespace, projectName, tag } = useProjectPage();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const { setCurrentHistoryId } = useCurrentHistoryId();

  const { isPending: isDeletingProjectHistory, deleteProjectHistory } = useDeleteProjectHistory(
    namespace,
    projectName,
    tag,
  );

  return (
    <div className="d-flex gap-1">
      <button
        onClick={() => {
          setCurrentHistoryId(historyId);
          hideModal();
        }}
        className="btn btn-sm btn-outline-dark"
      >
        <i className="bi bi-eye"></i>
      </button>
      {confirmDelete ? (
        <div className="d-flex flex-row align-items-center gap-1">
          <button
            onClick={() => {
              setConfirmDelete(false);
            }}
            className="btn btn-sm btn-outline-dark"
          >
            <i className="bi bi-x"></i>
          </button>
          <button
            onClick={() => {
              deleteProjectHistory(historyId, {
                onSuccess: () => {
                  setConfirmDelete(false);
                },
              });
            }}
            disabled={isDeletingProjectHistory}
            className="btn btn-sm btn-danger"
          >
            <i className="bi bi-check"></i>
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setConfirmDelete(true);
          }}
          className="btn btn-sm btn-danger"
        >
          <i className="bi bi-trash"></i>
        </button>
      )}
    </div>
  );
};

export const ProjectHistoryTable = (props: Props) => {
  const { hideModal } = props;

  const { namespace, projectName, tag } = useProjectPage();
  const projectAllHistoryQuery = useProjectAllHistory(namespace, projectName, tag);

  const historyUpdates = projectAllHistoryQuery.data?.history || [];

  const columnHelper = createColumnHelper<HistoryUpdate>();

  const columns = [
    columnHelper.accessor('change_id', {
      id: 'change_id',
      cell: (history) => history.getValue(),
      header: 'Change ID',
      size: 75,
    }),
    columnHelper.accessor('change_date', {
      id: 'change_date',
      cell: (history) => dateStringToDateTime(history.getValue()),
      header: 'Change Date',
    }),
    columnHelper.accessor('user', {
      id: 'user',
      cell: (history) => history.getValue(),
      header: 'User',
    }),
    columnHelper.display({
      id: 'actions',
      cell: (props) => <HistoryActions hideModal={hideModal} historyId={props.row.original.change_id} />,
      header: 'Actions',
      size: 120,
    }),
  ];

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data: historyUpdates,
    columns,
    getCoreRowModel: getCoreRowModel<HistoryUpdate>(),
    getPaginationRowModel: getPaginationRowModel<HistoryUpdate>(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  });

  return (
    <Fragment>
      <table className="table table-sm table-striped text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} style={{ width: `${header.getSize()}px` }}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="d-flex align-items-center gap-1">
        <button
          className="btn btn-sm btn-dark"
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </button>
        <button
          className="btn btn-sm btn-dark"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </button>
        <button className="btn btn-sm btn-dark" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {'>'}
        </button>
        <button className="btn btn-sm btn-dark" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>
          {'>>'}
        </button>
        <span className="d-flex align-items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount().toLocaleString()}
          </strong>
        </span>
      </div>
    </Fragment>
  );
};
