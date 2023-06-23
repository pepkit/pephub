import { Sample } from '../../types';

export const sampleListToArrays = (sampleList: Sample[]) => {
  // parse list of arbitrary samples into a list of arrays
  // where each array is a row in the table
  // for example this input:
  // [
  //   { col1: 's1_col1', col2: 's1_col2', col3: 's1_col3' },
  //   { col1: 's2_col1', col2: 's2_col2', col3: 's2_col3' },
  // ]
  //
  // will be parsed into this output:
  // [
  //   ['col1', 'col2', 'col3'],
  //   ['s1_col1', 's1_col2', 's1_col3'],
  //   ['s2_col1', 's2_col2', 's2_col3'],
  // ]

  const arraysList: any[][] = [];
  const headerRow: any[] = [];
  sampleList.forEach((sample) => {
    const row: any[] = [];
    Object.keys(sample).forEach((key) => {
      // add the key to the header row if it's not already there
      if (!headerRow.includes(key)) {
        headerRow.push(key);
      }
      // add the value to the row
      row.push(sample[key]);
    });
    arraysList.push(row);
  });
  arraysList.unshift(headerRow);
  return arraysList;
};

export const arraysToSampleList = (arraysList: any[][]) => {
  // parse the list of arrays into a list of samples
  // the first row will be the header row or sample keys
  // the rest of the rows will be the sample values
  //
  // for example this input:
  // [
  //   ['col1', 'col2', 'col3'],
  //   ['s1_col1', 's1_col2', 's1_col3'],
  //   ['s2_col1', 's2_col2', 's2_col3'],
  // ]
  //
  // will be parsed into this output:
  // [
  //   { col1: 's1_col1', col2: 's1_col2', col3: 's1_col3' },
  //   { col1: 's2_col1', col2: 's2_col2', col3: 's2_col3' },
  // ]

  // first row is the header row
  const headerRow = arraysList[0];
  const sampleList: Sample[] = [];

  arraysList.slice(1).forEach((row) => {
    // ignore empty rows
    if (row.every((cell) => !cell)) {
      return;
    }
    const sample: Sample = {};
    row.forEach((value, index) => {
      sample[headerRow[index]] = value;
    });
    sampleList.push(sample);
  });

  return sampleList;
};
