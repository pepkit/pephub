import { Modal } from 'react-bootstrap';
import React, { useState } from 'react';
import { useEditProjectMetaMutation } from '../../hooks/mutations/useEditProjectMetaMutation';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { ProjectMetaEditForm } from '../forms/edit-project-meta';
import { arraysToSampleList, sampleListToArrays } from '../../utils/sample-table';

import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';

import ReactSelect from 'react-select';

type Props = {
  namespace: string;
  project: string;
  tag: string;
  show: boolean;
  onHide: () => void;
  sampleTable: ReturnType<typeof useSampleTable>['data'];
  sampleTableIndex: string;
  newSamples: any;
  setNewSamples: (samples: any[][]) => void;
};

export const StandardizeMetadataModal = (props: Props) => {
  const { namespace, project, tag, show, onHide, sampleTable, sampleTableIndex, newSamples, setNewSamples } = props;

  // const tabDataRaw = sampleListToArrays(sampleTable?.items || [])
  const tabDataRaw = newSamples;
  const tabData = tabDataRaw[0].map((_, colIndex) => tabDataRaw.map(row => row[colIndex])).reduce((obj, row) => {
    const [key, ...values] = row;
    obj[key] = values;
    return obj;
  }, {});

  // console.log(tabDataRaw)
  // console.log(tabData)
  // console.log(sampleTableIndex)

  const data: DynamicData = {
    'sample_type': { 'Not Predictable': 0.0 },
    'genome': { 'biospecimen_class_term_label': 0.9097071290016174, 'prediction_2': 0.321412348, 'sample_type': 0.12534}
  };

  const formatToPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const handleRadioChange = (key, value) => {
    setSelectedValues(prev => {
      const newValues = {
        ...prev,
        [key]: value === null ? key : value
      };

      setWhereDuplicates(checkForDuplicates(newValues))
      
      return newValues;
    });
  };

  const checkForDuplicates = (values) => {
    const valueArray = Object.values(values);
    const duplicates = {};
    const result = [];

    for (let i = 0; i < valueArray.length; i++) {
      const value = valueArray[i];
      if (value in duplicates) {
        // If we haven't added this value's index yet, add it
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

  const getDefaultSelections = () => {
    const defaultSelections = {};
    Object.keys(data).forEach(key => {
      // if (data[key]['Not Predictable'] === 0) {
      //   defaultSelections[key] = key;  // Use the key itself as the default value
      // } else {
      //   const options = Object.entries(data[key]);
      //   const [bestOption] = options.reduce((best, current) => 
      //     current[1] > best[1] && current[0] !== 'Not Predictable' ? current : best
      //   );
      //   defaultSelections[key] = bestOption;
      // }
      defaultSelections[key] = key;
    });
    return defaultSelections;
  };

  type TabDataRow = string[];
  type TabData = TabDataRow[];
  type SelectedValues = Record<string, string>;

  const updateTabDataRaw = (tabDataRaw: TabData, selectedValues: SelectedValues): TabData => {
    if (tabDataRaw.length === 0) return tabDataRaw;

    // Create a new array to avoid mutating the original
    const updatedTabDataRaw: TabData = [tabDataRaw[0].slice(), ...tabDataRaw.slice(1)];

    // Update only the column names (first row) based on selectedValues
    Object.entries(selectedValues).forEach(([key, value]) => {
      const columnIndex = updatedTabDataRaw[0].indexOf(key);
      if (columnIndex !== -1 && key !== value) {
        updatedTabDataRaw[0][columnIndex] = value;
      }
    });

    return updatedTabDataRaw;
  };

  function prepareHandsontableData(key, selectedValues, tabData) {
    const selectedValue = selectedValues[key] || '';
    const topValues = tabData[key]?.slice(0, 6).map(item => [item]) || [];
    const emptyRows = Array(Math.max(0, 6 - topValues.length)).fill(['']);

    return [
      [selectedValue],
      ...topValues,
      ...emptyRows
    ];
  }


  const [selectedValues, setSelectedValues] = useState(getDefaultSelections());
  const [whereDuplicates, setWhereDuplicates] = useState(null)

  return (
    <Modal centered animation={false} show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Metadata Standardizer</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='row'>
          <div className='col-12 text-s'>
            <p>Use the metadata standardizer powered by BEDmess to bring consistency across metadata columns in all of your projects. 
            Compare predicted suggestions below (accuracy indicated in parenthesis) and choose whether to keep or discard them.
            Column contents [previewed in brackets] are not changed by the standardizer.
            After accepting the changes, save your project for them to take effect.</p>
          </div>
        </div>
        <div className='border-bottom' style={{'margin':'0 -1em'}}></div>


        <div className='row my-3'>
          <div className='col-12'>
            <h6 className='ms-1'>Standardizer Schema</h6>
            <div className='row'>
              <div className='col-9'>
                
                  <ReactSelect
                      className="top-z w-100 ms-1"
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          borderRadius: '.333333em', // Left radii set to 0, right radii kept at 4px
                        }),
                      }}
                      options={
                        [
                          { value: 'ENCODE', label: 'ENCODE' },
                          { value: 'Fairtracks', label: 'Fairtracks' },
                          { value: 'vanilla', label: 'Vanilla' }
                        ]
                      }
                    />
              </div>
              <div className='col-3'>
                <button className='btn btn-success float-end me-1 w-100'>
                Standardize!
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className='border-bottom' style={{'margin':'0 -1em'}}></div>

        <div className='row mb-2 mt-3'>
          <div className='col-6 text-center'>
            <h5>Original Column</h5>
          </div>
          <div className='col-6 text-center'>
            <h5>Predicted Column Header</h5>
          </div>
        </div>


        <form>
          {Object.keys(data).map((key, index) => (
            <div className="mb-3" key={key}>

              <div className='row border shadow-sm rounded-2 m-1 py-3' style={{'backgroundColor': whereDuplicates?.includes(index) ? '#dc354520' : 'white'}}>

                <div className='col-6 text-center'>
                  
                  <div className='w-100 h-100 overflow-auto border border-secondary-subtle rounded-2 shadow-s'>
                    <HotTable
                      data={prepareHandsontableData(key, selectedValues, tabData)}
                      colHeaders={false}
                      rowHeaders={true}
                      width='100%'
                      height='100%'
                      colWidths="100%"
                      stretchH="all"
                      autoColumnSize={false}
                      columns={[
                        {
                          data: 0,
                          type: typeof tabData[key] === 'number' ? 'numeric' : 'text',
                          renderer: function(instance, td, row, col, prop, value, cellProperties) {
                            Handsontable.renderers.TextRenderer.apply(this, arguments);
                            if (row === 0) {
                              td.style.fontWeight = 'bold';
                              if (whereDuplicates?.includes(index)) {
                                td.style.color= 'red';
                              }
                            }

                          }
                        }
                      ]}
                      licenseKey="non-commercial-and-evaluation"
                      className='custom-handsontable'
                    />
                  </div>

                </div>
                <div className='col-6' role='group' aria-label='radio_group'>
                  <div className='w-100 h-100 rounded-2 outer-container'>
                    <div className="btn-group-vertical h-100 w-100 bg-white rounded-2 h-100">
                      <input
                        className="btn-check"
                        type="radio"
                        name={key}
                        id={`${key}-original`}
                        value={key}
                        defaultChecked={selectedValues[key] === key}  // Check if the selected value is the same as the key
                        onChange={() => handleRadioChange(key, null)}
                      />
                      <label className='btn btn-outline-secondary selected-outline shadow-sm bg-white' htmlFor={`${key}-original`}>
                        <strong>{key}</strong> (original value)
                      </label>

                      {Object.entries(data[key]).map(([subKey, value], index, array) => (
                        <React.Fragment key={subKey}>
                          
                            <input
                              className="btn-check"
                              type="radio"
                              name={key}
                              id={`${key}-suggested-${subKey}`}
                              value={subKey}
                              defaultChecked={selectedValues[key] === subKey}
                              disabled={data[key]['Not Predictable'] === 0}
                              onChange={() => handleRadioChange(key, subKey)}
                            />
                            <label className="btn btn-outline-secondary selected-outline shadow-sm bg-white" htmlFor={`${key}-suggested-${subKey}`}>
                              {subKey} ({formatToPercentage(value)})
                            </label>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
                <br/>
              </div>
            </div>
          ))}
        </form>

      </Modal.Body>
      <Modal.Footer>

        {whereDuplicates !== null && (
          <div className="text-danger me-auto">
            Warning: ensure no duplicate column names have been selected.
          </div>
        )}
        

        <button 
          className='btn btn-outline-dark me-1'
          onClick={() => {
            onHide();
          }}
        >
          Cancel
        </button>
        <button 
          className='btn btn-success'
          disabled={whereDuplicates !== null}
          onClick={() => {
            console.log('Selected values:', selectedValues);

            const finalValues = Object.fromEntries(
              Object.entries(selectedValues).filter(([k, v]) => v !== k)
            );
            console.log('Selected values:', finalValues);

            // Update tabDataRaw
            const updatedTabDataRaw = updateTabDataRaw(tabDataRaw, finalValues);
            
            // Log the updated tabDataRaw
            console.log('Updated tabDataRaw:', updatedTabDataRaw);

            setNewSamples(updatedTabDataRaw);

            // Close the modal
            onHide();


          }}
        >
          Accept
        </button>
      </Modal.Footer>

    </Modal>
  );
};
