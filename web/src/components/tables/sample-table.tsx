import { FC } from 'react';
import { HotTable, HotColumn } from '@handsontable/react';
import { addClassesToRows } from './hooks-callbacks';
import { read } from 'fs';

interface Props {
  headers: string[];
  rows: any[][];
  setRows?: (rows: any[][]) => void;
  readOnly?: boolean;
}

export const SampleTable: FC<Props> = ({ headers, rows, readOnly = false, setRows }) => {
  return (
    <div className="rounded rounded-2">
      <HotTable
        data={rows}
        stretchH="all"
        height={700}
        readOnly={readOnly}
        colHeaders={headers}
        dropdownMenu={true}
        hiddenColumns={{
          indicators: true,
        }}
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
            !readOnly && setRows && setRows(rows.map((row, i) => (i === changes[0][0] ? changes[0][3] : row)));
          }
        }}
      >
        {headers.map((_, i) => (
          <HotColumn key={i} data={i} />
        ))}
      </HotTable>
    </div>
  );
};
