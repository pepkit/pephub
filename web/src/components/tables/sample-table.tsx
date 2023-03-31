import { FC } from 'react';
import { HotTable, HotColumn } from '@handsontable/react';
import { addClassesToRows } from './hooks-callbacks';

interface Props {
  headers: string[];
  rows: any[][];
}

export const SampleTable: FC<Props> = ({ headers, rows }) => {
  return (
    <div className="rounded rounded-2">
      <HotTable
        data={rows}
        stretchH="all"
        readOnly
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
      >
        {headers.map((_, i) => (
          <HotColumn key={i} data={i} />
        ))}
      </HotTable>
    </div>
  );
};
