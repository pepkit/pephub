import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';
import { useRef } from 'react';

import { Sample } from '../../../types';
import { arraysToSampleList, sampleListToArrays } from '../../utils/sample-table';
import { addClassesToRows } from './hooks-callbacks';

type Props = {
  className?: string;
  data: Sample[];
  onChange?: (rows: Sample[]) => void;
  readOnly?: boolean;
  height?: number;
  minRows?: number;
  stretchH?: 'none' | 'all' | 'last';
};
/**
 * This table is meant to handle csv strings, so just pass in
 * the csv string and it will handle the rest
 */
export const SampleTable = (props: Props) => {
  const { data, readOnly = false, onChange, height, minRows, stretchH, className } = props;
  // parse the list of objects into rows
  const rows = sampleListToArrays(data);
  const ROW_HEIGHT = 23; // px

  // compute table height based on number of rows
  // or the minRows prop if it is provided
  let tableHeight = rows.length * ROW_HEIGHT + 50;
  if (minRows) {
    tableHeight = minRows * ROW_HEIGHT + 50;
  }

  let tableClassName = '';
  if (className) {
    tableClassName += ` ${className}`;
  }

  const hotRef = useRef<HotTable>(null);

  if (hotRef) {
    // if data-bs-theme=="dark" then add dark theme to the table
    // data-bs-theme is on <html> tag
    const theme = document.documentElement.getAttribute('data-bs-theme');

    if (theme === 'dark') {
      tableClassName += ' htDark';
    }

    hotRef.current?.hotInstance?.updateSettings({
      className: tableClassName,
    });
  }

  return (
    <HotTable
      ref={hotRef}
      data={rows.length > 0 ? rows : [[]]}
      stretchH={stretchH || 'all'}
      height={height || tableHeight}
      readOnly={readOnly}
      colHeaders={true}
      renderer={(instance, td, row, col, prop, value, cellProperties) => {
        Handsontable.renderers.TextRenderer.apply(this, [instance, td, row, col, prop, value, cellProperties]);
        td.innerHTML = `<div class="truncated">${value || ''}</div>`;
        td.addEventListener('click', function (event) {
          const innerDiv = td.querySelector('.truncated');
          if (innerDiv && event.target === innerDiv) {
            innerDiv.classList.toggle('expanded');
          }
        });
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
      afterRemoveCol={(index, _amount) => {
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
  );
};
