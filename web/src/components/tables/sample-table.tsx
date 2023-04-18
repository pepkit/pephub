import { FC, useEffect, useState } from 'react';
import { HotTable, HotColumn } from '@handsontable/react';
import { addClassesToRows } from './hooks-callbacks';
import { readString } from 'react-papaparse';
import { tableDataToCsvString } from '../../utils/sample-table';
import { AddColumnModal } from '../modals/add-column-modal';

interface Props {
  data: string;
  onChange?: (rows: string) => void;
  readOnly?: boolean;
  height?: number;
}
/**
 * This table is meant to handle csv strings, so just pass in
 * the csv string and it will handle the rest
 */
export const SampleTable: FC<Props> = ({ data, readOnly = false, onChange, height }) => {
  // internal state
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);

  const [showAddColumnModal, setShowAddColumnModal] = useState<boolean>(false);

  // watch the data and update accordingly
  // this is for changes outside of the table
  useEffect(() => {
    if (data) {
      readString(data, {
        worker: true,
        complete: (results) => {
          // ts-ignore
          const data = results.data as any[][];
          setHeaders(data[0]);
          setRows(data.slice(1));
        },
      });
    }
  }, [data]);

  // if the user makes a change to the table,
  // we need to update the data if
  // the onChange prop is passed in
  useEffect(() => {
    if (onChange) {
      onChange(tableDataToCsvString(headers, rows));
    }
  }, [rows]);

  return (
    <div className="rounded rounded-2">
      {!readOnly && (
        <div className="p-1 border border-bottom-0 rounded-top">
          <button onClick={() => setShowAddColumnModal(true)} className="btn btn-sm btn-dark">
            <i className="bi bi-plus-circle me-1"></i>
            Add Column
          </button>
          <button disabled className="btn btn-sm btn-dark ms-1">
            <i className="bi bi-trash me-1"></i>
            Remove Column
          </button>
        </div>
      )}
      <HotTable
        data={rows}
        stretchH="all"
        height={height || 500}
        readOnly={readOnly}
        colHeaders={headers}
        dropdownMenu={true}
        hiddenColumns={{
          indicators: true,
        }}
        manualColumnMove
        contextMenu={true}
        multiColumnSorting={true}
        filters={true}
        rowHeaders={true}
        beforeRenderer={addClassesToRows}
        manualRowMove={true}
        licenseKey="non-commercial-and-evaluation"
        manualColumnResize
        afterChange={(changes) => {
          if (changes) {
            // update data in state
            const newRows = [...rows];
            changes.forEach(([row, col, _, newValue]) => {
              // @ts-ignore
              newRows[row][col] = newValue;
            });
            setRows(newRows);
          }
        }}
      >
        {headers.map((_, i) => (
          <HotColumn key={i} data={i} />
        ))}
      </HotTable>
      <AddColumnModal
        onAdd={(newColumnName) => {
          // add a new column to the right
          setRows((old: any[][]) => {
            const newTable = old.map((row) => {
              return [...row, ''];
            });
            return newTable;
          });
          setHeaders((old) => [...old, newColumnName]);
        }}
        show={showAddColumnModal}
        onHide={() => setShowAddColumnModal(false)}
      />
    </div>
  );
};
