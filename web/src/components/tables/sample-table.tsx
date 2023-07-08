import { HotTable } from '@handsontable/react';
import { FC } from 'react';

import { Sample } from '../../../types';
import { arraysToSampleList, sampleListToArrays } from '../../utils/sample-table';
import { addClassesToRows } from './hooks-callbacks';

interface Props {
  data: Sample[];
  onChange?: (rows: Sample[]) => void;
  readOnly?: boolean;
  height?: number;
}
/**
 * This table is meant to handle csv strings, so just pass in
 * the csv string and it will handle the rest
 */
export const SampleTable: FC<Props> = ({ data, readOnly = false, onChange, height }) => {
  // parse the list of objects into rows
  const rows = sampleListToArrays(data);

  return (
    <>
      <div className="rounded rounded-2">
        <HotTable
          data={rows.length > 0 ? rows : [[]]}
          stretchH="all"
          height={height || 900}
          readOnly={readOnly}
          colHeaders={true}
          dropdownMenu={true}
          hiddenColumns={{
            indicators: true,
          }}
          minCols={1}
          minRows={50}
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
            if (changes && onChange) {
              changes.forEach((change) => {
                const [row, col, _, newVal] = change;
                // @ts-ignore - we know that col is a number
                rows[row][col] = newVal;
              });
              onChange(arraysToSampleList(rows));
            }
          }}
          afterRemoveCol={(index, amount) => {
            // remove all values at the specified index from "rows"
            rows.forEach((row) => {
              row.splice(index, 0);
            });
            if (onChange) {
              onChange(arraysToSampleList(rows));
            }
          }}
          afterRemoveRow={(index, amount) => {
            rows.splice(index, 0);
            if (onChange) {
              onChange(arraysToSampleList(rows));
            }
          }}
        />
      </div>
    </>
  );
};
