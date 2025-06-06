import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';
import { useRef } from 'react';

import { addClassesToRows } from './hooks-callbacks';

const ROW_HEIGHT = 23; // px

type Props = {
  className?: string;
  data: any[][];
  onChange?: (rows: any[][]) => void;
  readOnly?: boolean;
  height?: number;
  minRows?: number;
  stretchH?: 'none' | 'all' | 'last';
  setFilteredSamples?: (samples: string[]) => void;
  sampleTableIndex?: string;
};

export const SampleTable = (props: Props) => {
  const {
    data,
    readOnly = false,
    onChange,
    height,
    minRows,
    stretchH,
    className,
    setFilteredSamples,
    sampleTableIndex,
  } = props;

  // compute table height based on number of rows
  // or the minRows prop if it is provided
  let tableHeight = data.length * ROW_HEIGHT + 50;

  // if minRows is provided, then use that as the height
  if (minRows) {
    tableHeight = minRows * ROW_HEIGHT + 50;
  }

  let tableClassName = '';
  if (className) {
    tableClassName += ` ${className}`;
  }

  const hotRef = useRef<HotTable>(null);

  if (hotRef) {
    hotRef.current?.hotInstance?.updateSettings({
      className: tableClassName,
    });
  }

  // const columns = data[0].map((header, index) => ({
  //   data: index,
  //   readOnly: header === 'ph_id' || readOnly
  // }));

  const numColumns = data.length > 0 ? data[0].length : 0;

  const ph_id_col = data[0].indexOf('ph_id');
  let sampleTableIndexCol = 0;
  if (sampleTableIndex) {
    sampleTableIndexCol = data[0].indexOf(sampleTableIndex);
  }

  return (
    <HotTable
      afterFilter={(k) => {
        if (!setFilteredSamples) {
          return;
        }

        // if there are filters applied, then filter the samples
        if (k.length > 0) {
          const hotdata = hotRef.current?.hotInstance?.getData() || [];
          const filteredSamples = hotdata
            .map((subArray) => subArray[sampleTableIndexCol])
            .filter((element) => element != null);
          if (sampleTableIndex) {
            const sampleTableIndexIndex = filteredSamples.indexOf(sampleTableIndex);
            if (sampleTableIndexIndex > -1) {
              const filteredSamplesIndex = filteredSamples.splice(sampleTableIndexIndex, 1);
            }
          }
          setFilteredSamples(filteredSamples);
          // if there are no filters applied, then set the filtered samples to an empty array
        } else {
          setFilteredSamples([]);
        }
      }}
      ref={hotRef}
      data={data}
      stretchH={stretchH || 'all'}
      // height={height || tableHeight}
      height={height || '100%'}
      readOnly={readOnly}
      colHeaders={true}
      // columns={columns}
      cells={(row, col, prop) => {
        const cellProperties = {} as { isHeader?: boolean };
        if (row === 0) {
          cellProperties.isHeader = true;
        } else {
          cellProperties.isHeader = false;
        }
        // if (col === ph_id_col) {
        //   cellProperties.readOnly = true;
        // }
        return cellProperties;
      }}
      renderer={(instance, td, row, col, prop, value, cellProperties) => {
        Handsontable.renderers.TextRenderer.apply(this, [instance, td, row, col, prop, value, cellProperties]);
        if (cellProperties.isHeader) {
          td.style.fontWeight = 'bold';
        } else {
          td.style.fontWeight = 'normal';
        }
        td.innerHTML = `<div class="truncated">${value || ''}</div>`;
        td.addEventListener('click', function (event) {
          const innerDiv = td.querySelector('.truncated');
          if (innerDiv && event.target === innerDiv) {
            innerDiv.classList.toggle('expanded');
          }
        });
      }}
      hiddenColumns={{
        indicators: true,
        columns: ph_id_col === -1 ? [] : [numColumns - 1],
      }}
      dropdownMenu={true}
      minCols={2}
      minRows={minRows || 50}
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
      multiColumnSorting={false}
      columnSorting={false}
      filters={true}
      rowHeaders={true}
      beforeRenderer={addClassesToRows}
      manualRowMove={true}
      licenseKey="non-commercial-and-evaluation"
      manualColumnResize
      beforeCopy={(data, coords) => {
        if (ph_id_col === -1 || ph_id_col < coords[0].startCol || ph_id_col > coords[0].endCol) {
          return;
        }

        const relative_ph_id_col = ph_id_col - coords[0].startCol;

        if (relative_ph_id_col >=0 && relative_ph_id_col < data[0].length) {
          for (let i = 0; i < data.length; i++) {
            data[i].splice(relative_ph_id_col, 1);
          }
        }
      }}
      beforePaste={(data) => {
        const paste_ph_id_col = data[0].indexOf('ph_id');

        if (paste_ph_id_col === -1) {
          return;
        }

        if (paste_ph_id_col >=0 && paste_ph_id_col < data[0].length) {
          for (let i = 0; i < data.length; i++) {
            data[i].splice(paste_ph_id_col, 1);
          }
        }
      }}
      afterChange={(changes) => {
        if (changes && onChange) {
          changes.forEach((change) => {
            const [row, col, _, newVal] = change;
            // @ts-ignore we know that col is a number
            data[row][col] = newVal;
          });

          onChange(data);
        }
      }}
      afterRemoveCol={(index, _amount) => {
        // remove all values at the specified index from "rows"
        data.forEach((row) => {
          row.splice(index, 0);
        });
        if (onChange) {
          onChange(data);
        }
      }}
      afterRemoveRow={(index, _amount) => {
        data.splice(index, 0);
        if (onChange) {
          onChange(data);
        }
      }}
    />
  );
};
