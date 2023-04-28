import { FC, useEffect, useState } from 'react';
import { HotTable } from '@handsontable/react';
import { addClassesToRows } from './hooks-callbacks';
import { readString } from 'react-papaparse';
import { tableDataToCsvString } from '../../utils/sample-table';

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
  const [rows, setRows] = useState<any[][]>([[]]);

  // watch the data and update accordingly
  // this is for changes outside of the table
  useEffect(() => {
    if (data) {
      readString(data, {
        worker: true,
        complete: (results) => {
          // ts-ignore
          let data = results.data as any[][];

          // check to make sure data isnt a list of objects
          // if it is, we need to convert it to a list of lists
          if (data.length > 0 && typeof data[0] === 'object') {
            data = data.map((row) => Object.values(row));
          }

          setRows(data);
        },
      });
    }
  }, [data]);

  // if the user makes a change to the table,
  // we need to update the data if
  // the onChange prop is passed in
  //
  useEffect(() => {
    if (onChange && rows) {
      onChange(tableDataToCsvString(rows));
    }
  }, [rows]);

  return (
    <>
      <div className="rounded rounded-2">
        <HotTable
          data={rows}
          stretchH="all"
          height={height || 900}
          readOnly={readOnly}
          colHeaders={true}
          dropdownMenu={true}
          hiddenColumns={{
            indicators: true,
          }}
          minRows={500}
          contextMenu={[
            'row_above',
            'row_below',
            '---------',
            'col_left',
            'col_right',
            '---------',
            'remove_row',
            'remove_col',
            '---------',
            'alignment',
            '---------',
            'copy',
            'cut',
          ]}
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
        />
      </div>
    </>
  );
};
