import React from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';

import { formatToPercentage } from '../../utils/etc';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { arraysToSampleList, sampleListToArrays } from '../../utils/sample-table';
import { LoadingSpinner } from '../spinners/loading-spinner';

type BrowseTableProps = {
  namespace: string;
  project: string;
  tag: string;
};

export const BrowseTable = (props: BrowseTableProps) => {
  const { namespace, project, tag } = props;

  const PH_ID_COL = 'ph_id';

  const { data: tabData, isFetching } = useSampleTable({
    namespace,
    project,
    tag,
    enabled: true
  });

  const tabSamples = tabData?.items || [];

  const tabSamplesNoPHID = sampleListToArrays(tabSamples.map(sample => {
    const { [PH_ID_COL]: _, ...rest } = sample;
    return rest;
  }));

  return (
    <>
      {isFetching ? (
        <div className="col text-center my-4">
          <LoadingSpinner />
        </div> 
      ) : tabSamples.length > 0 ? (
        <div className="col w-100 h-100">
          <p className='fw-medium text-sm mb-1'>Sample Table:</p>
          <div className="col overflow-auto border border-secondary-subtle rounded-2 shadow-sm p-0">
            <HotTable
              data={tabSamplesNoPHID}
              colHeaders={false}
              rowHeaders={true}
              width="100%"
              height={Math.min((tabSamples.length + 1) * 23, 180)}
              colWidths="100%"
              stretchH="all"
              autoColumnSize={false}
              readOnly={true}
              cells={(row, col) => {
                const cellProperties: Handsontable.CellProperties = {
                  row: row,
                  col: col,
                  className: row === 0 ? 'fw-bold' : '',
                  instance: {} as Handsontable.Core,
                  visualRow: row,
                  visualCol: col,
                  prop: col
                };
                return cellProperties;
              }}
              licenseKey="non-commercial-and-evaluation"
              className="custom-handsontable"
            />
          </div>
        </div>
      ) : (
        <div className="col text-center text-sm my-4">
          <span className='fw-semibold'>This project has no samples.</span>
        </div>
      )}
    </>
  );
};
