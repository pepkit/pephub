import React from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import { formatToPercentage } from '../../utils/etc';

type StandardizerTableProps = {
  columnKey: string;
  columnIndex: number;
  standardizedData: Record<string, number>;
  selectedValues: string;
  whereDuplicates: number[] | null;
  sampleTableIndex: string;
  tabData: string[];
  handleRadioChange: (key: string, value: string | null) => void;
  tableData: string[][];
};

export const StandardizerTable = (props: StandardizerTableProps) => {
  const {
    columnKey,
    columnIndex,
    standardizedData,
    selectedValues,
    whereDuplicates,
    sampleTableIndex,
    tabData,
    handleRadioChange,
    tableData,
  } = props;

  return (
    <>
        <div className="mb-3" key={columnKey}>
          <div
            className={
              columnKey === sampleTableIndex
                ? 'row border shadow-sm rounded-3 m-1 pb-3 pt-2'
                : 'row border shadow-sm rounded-3 m-1 py-3'
            }
            style={{
              backgroundColor: whereDuplicates?.includes(columnIndex)
                ? '#dc354520'
                : columnKey === sampleTableIndex
                ? '#ffc10720'
                : 'white',
            }}
          >
            {columnKey === sampleTableIndex ? (
              <p className="text-center text-xs mb-2 p-0 fw-bold">
                SampleTableIndex must also be updated in project config!
              </p>
            ) : null}
            <div className="col-6 text-center">
              <div
                className="w-100 h-100 overflow-auto border border-secondary-subtle rounded-2 shadow-sm"
                style={{ bottom: '-1px' }}
              >
                <HotTable
                  data={tableData}
                  colHeaders={false}
                  rowHeaders={true}
                  width="100%"
                  height="100%"
                  colWidths="100%"
                  stretchH="all"
                  autoColumnSize={false}
                  readOnly={true}
                  columns={[
                    {
                      data: 0,
                      type: typeof tabData === 'number' ? 'numeric' : 'text',
                      renderer: function (
                        instance: Handsontable.Core,
                        td: HTMLTableCellElement,
                        row: number,
                        col: number,
                        prop: string | number,
                        value: any,
                        cellProperties: Handsontable.CellProperties,
                      ) {
                        Handsontable.renderers.TextRenderer.apply(this, [
                          instance,
                          td,
                          row,
                          col,
                          prop,
                          value,
                          cellProperties,
                        ]);
                        if (row === 0) {
                          td.style.fontWeight = 'bold';
                          if (whereDuplicates?.includes(columnIndex)) {
                            td.style.color = 'red';
                          }
                        }
                      },
                    },
                  ]}
                  licenseKey="non-commercial-and-evaluation"
                  className="custom-handsontable"
                />
              </div>
            </div>
            <div className="col-6" role="group" aria-label="radio_group">
              <div className="w-100 h-100 rounded-2 outer-container">
                <div className="btn-group-vertical w-100 h-100 bg-white rounded-2">
                  <input
                    className="btn-check"
                    type="radio"
                    name={columnKey}
                    id={`${columnKey}-original`}
                    value={columnKey}
                    checked={selectedValues === columnKey}
                    onChange={() => handleRadioChange(columnKey, null)}
                  />
                  <label
                    className="btn btn-outline-secondary selected-outline shadow-sm bg-white"
                    htmlFor={`${columnKey}-original`}
                  >
                    <strong className="fw-semibold">{columnKey}</strong> (original value)
                  </label>

                  {Object.entries(standardizedData).map(([subKey, value]) => (
                    <React.Fragment key={subKey}>
                      <input
                        className="btn-check"
                        type="radio"
                        name={columnKey}
                        id={`${columnKey}-suggested-${subKey}`}
                        value={subKey}
                        checked={selectedValues === subKey}
                        disabled={standardizedData['Not Predictable'] === 0}
                        onChange={() => handleRadioChange(columnKey, subKey)}
                      />
                      <label
                        className="btn btn-outline-secondary selected-outline shadow-sm bg-white"
                        htmlFor={`${columnKey}-suggested-${subKey}`}
                      >
                        {subKey} ({formatToPercentage(value)})
                      </label>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <br />
          </div>
        </div>
    </>
  );
};