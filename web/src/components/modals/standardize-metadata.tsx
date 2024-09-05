import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';
import React, { FormEvent, useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from 'react-bootstrap';
import ReactSelect from 'react-select';

import { useEditProjectMetaMutation } from '../../hooks/mutations/useEditProjectMetaMutation';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { useStandardize } from '../../hooks/queries/useStandardize';
import { arraysToSampleList, sampleListToArrays } from '../../utils/sample-table';
import { ProjectMetaEditForm } from '../forms/edit-project-meta';
import { LoadingSpinner } from '../spinners/loading-spinner'
import { formatToPercentage } from '../../utils/etc'

type Props = {
  namespace: string;
  project: string;
  tag: string;
  show: boolean;
  onHide: () => void;
  sampleTable: ReturnType<typeof useSampleTable>['data'];
  sampleTableIndex: string;
  newSamples: any[][];
  setNewSamples: (samples: any[][]) => void;
  resetStandardizedData: boolean;
  setResetStandardizedData: (boolean) => void;
};

type TabDataRow = string[];
type TabData = TabDataRow[];
type SelectedValues = Record<string, string>;
type AvailableSchemas = 'ENCODE' | 'FAIRTRACKS';

type StandardizedData = Record<string, Record<string, number>>;

export const StandardizeMetadataModal = (props: Props) => {
  const { namespace, project, tag, show, onHide, sampleTable, sampleTableIndex, newSamples, setNewSamples, resetStandardizedData, setResetStandardizedData } = props;

  const tabDataRaw = newSamples;
  const tabData = tabDataRaw[0]
    .map((_, colIndex) => tabDataRaw.map((row) => row[colIndex]))
    .reduce((obj, row) => {
      const [key, ...values] = row;
      obj[key as string] = values;
      return obj;
    }, {} as Record<string, any[]>);

  const originalCols: string[] = useMemo(() => Object.keys(tabData), []);
  const newCols: string[] = Object.keys(tabData);

  const [selectedOption, setSelectedOption] = useState<{ value: AvailableSchemas; label: string } | null>(null);
  const [selectedValues, setSelectedValues] = useState<SelectedValues>({});
  const [whereDuplicates, setWhereDuplicates] = useState<number[] | null>(null);

  const {
    isFetching,
    isError,
    error,
    data: rawData,
    refetch: standardize,
  } = useStandardize(namespace, project, tag, selectedOption?.value);

  const data = resetStandardizedData ? rawData : null;

  const standardizedData = data?.results as StandardizedData | undefined;

  const getOriginalColValues = (key: string): string | undefined => {
    const oldColIndex = originalCols.indexOf(key);
    if (oldColIndex !== -1 && oldColIndex < newCols.length) {
      return newCols[oldColIndex];
    }
    return undefined;
  };

  const handleRadioChange = (key: string, value: string | null) => {
    setSelectedValues((prev) => {
      const newValues = {
        ...prev,
        [key]: value === null ? key : value,
      };
      setWhereDuplicates(checkForDuplicates(newValues));
      return newValues;
    });
  };

  const checkForDuplicates = (values: SelectedValues): number[] | null => {
    const valueArray = Object.values(values);
    const duplicates: Record<string, number[]> = {};
    const result: number[] = [];

    for (let i = 0; i < valueArray.length; i++) {
      const value = valueArray[i];
      if (value in duplicates) {
        if (duplicates[value].length === 1) {
          result.push(duplicates[value][0]);
        }
        result.push(i);
      } else {
        duplicates[value] = [i];
      }
    }

    return result.length > 0 ? result : null;
  };

  const getDefaultSelections = (standardizedData: StandardizedData): SelectedValues => {
    const defaultSelections: SelectedValues = {};
    Object.keys(standardizedData).forEach((key) => {
      defaultSelections[key] = key;
    });
    return defaultSelections;
  };

  const updateTabDataRaw = (tabDataRaw: TabData, selectedValues: SelectedValues): TabData => {
    if (tabDataRaw.length === 0) return tabDataRaw;

    const updatedTabDataRaw: TabData = [tabDataRaw[0].slice(), ...tabDataRaw.slice(1)];

    Object.entries(selectedValues).forEach(([key, value]) => {
      let columnIndex = updatedTabDataRaw[0].indexOf(key);
      if (columnIndex === -1) {
        const originalValue = getOriginalColValues(key)
        if (originalValue) {
          columnIndex = updatedTabDataRaw[0].indexOf(originalValue)
        }
      }
      if (columnIndex !== -1) {
        updatedTabDataRaw[0][columnIndex] = value;
      }
    });

    return updatedTabDataRaw;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetStandardizedData(true);
    await standardize();
  };

  const prepareHandsontableData = useCallback((key: string) => {
    const selectedValue = selectedValues[key] || '';
    const originalValue = getOriginalColValues(key)
    let topValues: string[][] = []
    if (originalValue) {
      topValues = tabData[key]?.slice(0, 6).map((item) => [item]) || tabData[originalValue]?.slice(0, 6).map((item) => [item]) || [];
    }
    const emptyRows = Array(Math.max(0, 6 - topValues.length)).fill(['']);

    return [[selectedValue], ...topValues, ...emptyRows];
  }, [selectedValues, tabData]);

  useEffect(() => {
    if (standardizedData) {
      const defaultSelections = getDefaultSelections(standardizedData);
      setWhereDuplicates(checkForDuplicates(defaultSelections));
      setSelectedValues(defaultSelections);
    }
  }, [standardizedData]);

  useEffect(() => {
    if (!resetStandardizedData) {
      setSelectedOption(null);
      setSelectedValues({});
      setWhereDuplicates(null);
    }
  }, [resetStandardizedData]);


  return (
    <Modal centered animation={false} show={show} onHide={onHide} size="xl">
      <Modal.Body>
        <div className='p-1 modal-pill'>
          <h1 className="fs-5 mb-1 fw-semibold d-inline">Metadata Standardizer</h1>
          <button
            className="btn btn-outline-dark px-1 py-0 m-0 float-end d-inline rounded-3 border-0 shadow-none"
            type="button" 
            onClick={() => {
              onHide();
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
          <p className='text-sm mt-1 mb-3'>
            Use the metadata standardizer powered by BEDmess to bring consistency across metadata columns in all of
            your projects. After choosing a standardizer schema below, compare predicted suggestions (confidence indicated in parenthesis) and choose whether
            to keep or discard them. Column contents are not modified by the standardizer.
            After accepting the changes, save your project for them to take effect.
          </p>
          <div className="border-bottom" style={{ margin: '0 -1.25em' }}></div>

          <div className="row mt-3 mb-4">
            <div className="col-12">
              <p className="mb-1 fw-semibold text-sm">Standardizer Schema</p>

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-9 pe-0">
                    <ReactSelect
                      className="top-z w-100"
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          borderRadius: '.333333em', // Left radii set to 0, right radii kept at 4px
                        }),
                      }}
                      options={[
                        // @ts-ignore
                        { value: 'ENCODE', label: 'ENCODE' },
                        // @ts-ignore
                        { value: 'FAIRTRACKS', label: 'Fairtracks' },
                      ]}
                      defaultValue={selectedOption}
                      value={selectedOption}
                      onChange={(selectedOption) => {
                        if (selectedOption === null) {
                          return;
                        }
                        setSelectedOption(selectedOption);
                      }}
                    />
                  </div>
                  <div className="col-3">
                    <button className="btn btn-success float-end w-100" type="submit" disabled={selectedOption === null}>
                      Standardize!
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {standardizedData && !isFetching ? (
            <>
              <div className="border-bottom mt-4" style={{ margin: '0 -1.25em' }}></div>

              <div className="row mb-2 mt-3">
                <div className="col-6 text-center">
                  <p className='mb-0 fw-semibold'>Original Column</p>
                </div>
                <div className="col-6 text-center">
                  <p className='mb-0 fw-semibold'>Predicted Column Header</p>
                </div>
              </div>

              <form>
                {Object.keys(standardizedData).map((key, index) => (
                  <div className="mb-3" key={key}>
                    <div
                      className={(key === sampleTableIndex) ? "row border shadow-sm rounded-3 m-1 pb-3 pt-2" : "row border shadow-sm rounded-3 m-1 py-3"}
                      style={{ backgroundColor: whereDuplicates?.includes(index) ? '#dc354520' : (key === sampleTableIndex) ? '#ffc10720' : 'white' }}
                    >
                      {key === sampleTableIndex ? <p className='text-center text-xs mb-2 p-0 fw-bold'>SampleTableIndex must also be updated in project config!</p> : null}
                      <div className="col-6 text-center">
                        <div className="w-100 h-100 overflow-auto border border-secondary-subtle rounded-2 shadow-sm"
                          style={{'bottom': '-1px'}}>
                          <HotTable
                            data={prepareHandsontableData(key)}
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
                                type: typeof tabData[key] === 'number' ? 'numeric' : 'text',
                                renderer: function(
                                  instance: Handsontable.Core,
                                  td: HTMLTableCellElement,
                                  row: number,
                                  col: number,
                                  prop: string | number,
                                  value: any,
                                  cellProperties: Handsontable.CellProperties
                                ) {
                                  Handsontable.renderers.TextRenderer.apply(this, [instance, td, row, col, prop, value, cellProperties]);
                                  if (row === 0) {
                                    td.style.fontWeight = 'bold';
                                    if (whereDuplicates?.includes(index)) {
                                      td.style.color = 'red';
                                    }
                                  }
                                }
                              }
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
                              name={key}
                              id={`${key}-original`}
                              value={key}
                              checked={selectedValues[key] === key} // Check if the selected value is the same as the key
                              onChange={() => handleRadioChange(key, null)}
                            />
                            <label
                              className="btn btn-outline-secondary selected-outline shadow-sm bg-white"
                              htmlFor={`${key}-original`}
                            >
                              <strong className='fw-semibold'>{key}</strong> (original value)
                            </label>

                            {Object.entries(standardizedData[key]).map(([subKey, value], index, array) => (
                              <React.Fragment key={subKey}>
                                <input
                                  className="btn-check"
                                  type="radio"
                                  name={key}
                                  id={`${key}-suggested-${subKey}`}
                                  value={subKey}
                                  checked={selectedValues[key] === subKey}
                                  disabled={standardizedData[key]['Not Predictable'] === 0}
                                  onChange={() => handleRadioChange(key, subKey)}
                                />
                                <label
                                  className="btn btn-outline-secondary selected-outline shadow-sm bg-white"
                                  htmlFor={`${key}-suggested-${subKey}`}
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
                ))}
              </form>
            </>
          ) : isFetching ? 

            <div className='row text-center my-5'>
              <LoadingSpinner />
            </div>
           : 
          null
        }

          <div className="border-bottom" style={{ margin: '0 -1.25em' }}></div>
          <div>
            {whereDuplicates !== null && (
              <div className="text-danger me-auto mt-3 pt-2 d-inline-block">Warning: ensure no duplicate column names have been selected.</div>
            )}
            <button
              className="btn btn-secondary mt-3 mb-1 float-end"
              disabled={whereDuplicates !== null || isFetching || isError || !data}
              onClick={() => {
                const updatedTabDataRaw = updateTabDataRaw(tabDataRaw, selectedValues);
                setNewSamples(updatedTabDataRaw);
                onHide();
              }}
            >
              Accept
            </button>
            <button
              className="btn btn-outline-dark mt-3 mb-1 me-1 float-end"
              onClick={() => {
                onHide();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
