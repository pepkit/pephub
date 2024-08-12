import { Modal } from 'react-bootstrap';
import React, { useState } from 'react';
import { useEditProjectMetaMutation } from '../../hooks/mutations/useEditProjectMetaMutation';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { ProjectMetaEditForm } from '../forms/edit-project-meta';
import { arraysToSampleList, sampleListToArrays } from '../../utils/sample-table';

type Props = {
  namespace: string;
  project: string;
  tag: string;
  show: boolean;
  onHide: () => void;
  sampleTable: ReturnType<typeof useSampleTable>['data'];
  sampleTableIndex: string;
};

export const StandardizeMetadataModal = (props: Props) => {
  const { namespace, project, tag, show, onHide, sampleTable, sampleTableIndex } = props;

  const tabDataRaw = sampleListToArrays(sampleTable?.items || [])
  const tabData = tabDataRaw[0].map((_, colIndex) => tabDataRaw.map(row => row[colIndex])).reduce((obj, row) => {
    const [key, ...values] = row;
    obj[key] = values;
    return obj;
  }, {});

  // console.log(tabData)
  // console.log(sampleTableIndex)

  const data: DynamicData = {
    'sample_type': { 'Not Predictable': 0.0 },
    'genome': { 'biospecimen_class_term_label': 0.9097071290016174, 'prediction_2': 0.321412348, 'sample_type': 0.12534}
  };

  const formatToPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const [selectedValues, setSelectedValues] = useState({});
  const [hasDuplicates, setHasDuplicates] = useState(false);

  const handleRadioChange = (key, value) => {
    setSelectedValues(prev => {
      let newValues;
      if (value === null) {
        // Create a new object without the specified key
        const { [key]: _, ...rest } = prev;
        newValues = rest;
      } else {
        // Add or update the key-value pair
        newValues = {
          ...prev,
          [key]: value
        };
      }
      
      // Check for duplicates
      setHasDuplicates(checkForDuplicates(newValues));
      
      return newValues;
    });
  };

  const checkForDuplicates = (values) => {
    const valueSet = new Set();
    const keys = new Set(Object.keys(tabData));

    for (const [key, value] of Object.entries(values)) {
      // Remove the current key from the set of tabData keys
      keys.delete(key);

      // Check if the value is already in the set or matches a remaining key in tabData
      if (valueSet.has(value) || keys.has(value)) {
        return true; // Found a duplicate
      }

      valueSet.add(value);
    }

    return false; // No duplicates found
  };

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
        <div className='border-bottom' style={{'margin':'0 -1em'}}>
        </div>
        <div className='row mb-2 mt-3'>
          <div className='col-6 text-center'>
            <h5>Original Column</h5>
          </div>
          <div className='col-6 text-center'>
            <h5>Predicted Standardized Column</h5>
          </div>
        </div>

        <form>
          {Object.keys(data).map((key) => (
            <div className="mb-3" key={key}>

              <div className='row border shadow-sm rounded-2 m-1 pt-3'>
                <div className='col-6'>
                  <p className='fw-bold'>{key}</p>

                  {tabData[key] && (
                    <p>[{tabData[key].slice(0, 3).join(', ')}]</p>
                  )}

                </div>
                <div className='col-6 mb-3' role='group' aria-label='radio_group'>
                  <div className="btn-group-vertical w-100">
                    {Object.entries(data[key]).map(([subKey, value], index, array) => (
                      <React.Fragment key={subKey}>
                        
                          <input
                            className="btn-check"
                            type="radio"
                            name={key}
                            id={`${key}-suggested-${subKey}`}
                            value={subKey}
                            defaultChecked={(value !== 0) && (index === 0)}
                            disabled={data[key]['Not Predictable'] === 0}
                            onChange={() => handleRadioChange(key, subKey)}
                          />
                          <label className="btn btn-outline-secondary selected-outline shadow-sm" htmlFor={`${key}-suggested-${subKey}`}>
                            {subKey} ({formatToPercentage(value)})
                          </label>
                      </React.Fragment>
                    ))}

                    <input
                      className="btn-check"
                      type="radio"
                      name={key}
                      id={`${key}-original`}
                      value="original"
                      defaultChecked={data[key]['Not Predictable'] === 0}
                      onChange={() => handleRadioChange(key, null)}
                    />
                    <label className='btn btn-outline-secondary selected-outline shadow-sm' htmlFor={`${key}-original`}>
                      Keep Original
                    </label>
                  </div>
                </div>
                <br/>
              </div>
            </div>
          ))}
        </form>

      </Modal.Body>
      <Modal.Footer>

        {hasDuplicates && (
          <div className="text-danger me-auto">
            Warning: ensure no duplicates between original and predicted columns have been selected.
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
          disabled={hasDuplicates}
          onClick={() => {
            console.log('Selected values:', selectedValues);
          }}
        >
          Accept
        </button>
      </Modal.Footer>

    </Modal>
  );
};
