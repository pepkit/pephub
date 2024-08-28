import { toast } from 'react-hot-toast';

import { Sample } from '../../types';

const PH_ID_COL = 'ph_id';

const arraysAreEmpty = (arraysList: any[][]) => {
  // check if the list of arrays is full of nulls
  // if so, then the list is empty
  let empty = true;
  arraysList.forEach((array) => {
    array.forEach((item) => {
      if (item !== null) {
        empty = false;
      }
    });
  });
  return empty;
};

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

  // console.log(arraysList)

  const uniquePhIds = new Set();

  // first row is the header row
  let headerRow = arraysList[0];

  console.log(headerRow)

  // look for duplicate values in the header row
  const duplicateHeaders = {};
  headerRow.forEach((header, index) => {
    if (header && (header in duplicateHeaders)) {
      duplicateHeaders[header].push(index);
    } else {
      duplicateHeaders[header] = [index];
    }
  });

  // Filter out non-duplicates and prepare error message
  const realDuplicates = Object.entries(duplicateHeaders)
    .filter(([_, indices]) => indices.length > 1);

  // If there are duplicate headers, throw an error
  if (realDuplicates.length > 0) {
    const errorMessage = realDuplicates
      .map(([header, indices]) => `"${header}" at columns ${indices.map(i => i + 1).join(', ')}`)
      .join('; ');
    throw new Error(`PEPs cannot have duplicate column headers. Rename duplicate column headers. \n\n Duplicate headers found: ${errorMessage}`);
  }

  // find ph_id index
  let phIdIndex = headerRow.findIndex(header => header === 'ph_id');
  if (phIdIndex === -1) {
    phIdIndex = headerRow.length; // Use the last column index if 'ph_id' is not found
  }

  console.log(phIdIndex)

  // find index of last non-null column header before phIdIndex
  let lastNonNullIndex = phIdIndex;
  while (lastNonNullIndex >= 0 && headerRow[lastNonNullIndex - 1] === null) {
    lastNonNullIndex--;
  }

  // Check columns from lastNonNullIndex + 1 to phIdIndex - 1
  const columnsToRemove = [];
  for (let colIndex = lastNonNullIndex; colIndex < phIdIndex; colIndex++) {
    // Check if all values in this column are null
    const allNull = arraysList.slice(1).every(row => row[colIndex] === null);
    
    if (allNull) {
      columnsToRemove.push(colIndex);
    }
  }

  // remove entirely null columns
  if (columnsToRemove.length > 0) {
    for (let i = 0; i < arraysList.length; i++) {
      arraysList[i] = arraysList[i].filter((_, index) => !columnsToRemove.includes(index));
    }
    headerRow = arraysList[0];
  }

  // Check for null column headers
  const nullHeaderIndices = arraysList[0]
    .map((header, index) => (header === null || header === '') ? index : -1)
    .filter(index => index !== -1);

  if (nullHeaderIndices.length > 0) {
    const errorMessage = `PEPs cannot have empty column headers. Either add column headers or remove the columns. \n\n Empty headers found at columns: ${nullHeaderIndices.map(i => i + 1).join(', ')}`;
    throw new Error(errorMessage);
  }

  // get the rest of the rows
  const theRest = arraysList.slice(1);

  let sampleList: Sample[] = [];

  // if there's only a header row, return a list with one sample where all the property values are null
  if (arraysAreEmpty(theRest)) {
    const sample: Sample = {};
    headerRow.forEach((key) => {
      sample[key] = null;
    });
    sampleList.push(sample);
    return sampleList;
  }

  theRest.forEach((row) => {
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

  // filter all samples where **all** attriutes are falsey
  // except for the `ph_id` attribute
  sampleList = sampleList.filter((sample) => {
    let hasNonNull = false;
    Object.keys(sample).forEach((key) => {
      if (key !== PH_ID_COL && sample[key]) {
        hasNonNull = true;
      }
    });
    return hasNonNull;
  });

  // add the ph_id column to the sample list if it doesn't exist
  sampleList.forEach((sample) => {
    if (!sample[PH_ID_COL]) {
      sample[PH_ID_COL] = null;
    } else if (uniquePhIds.has(sample[PH_ID_COL])) {
      sample[PH_ID_COL] = null;
    } else {
      uniquePhIds.add(sample[PH_ID_COL]);
    }
  });

  console.log(sampleList)

  return sampleList;
};

/**
 * Convert a list of samples into an object of objects. Given the example input:
 * #### Given the example table:
| sample_name | genome | path |
|------------|------------|------------|
| sample1    | hg38   | data/s1.fastq.gz    |
| sample2   | hg38    | data/s2.fastq.gz    |
| sample3    | hg38    | data/s3.fastq.gz    |

#### We can represent it as a list of objects:
```json
[
  {
    "sample_name": "sample1",
    "genome": "hg38",
    "path": "data/s1.fastq.gz"
  },
  {
    "sample_name": "sample2",
    "genome": "hg38",
    "path": "data/s2.fastq.gz"
  },
  {
    "sample_name": "sample3",
    "genome": "hg38",
    "path": "data/s3.fastq.gz"
  }
]
```

#### or, an object of objects:
```json
{
  "sample_name": {
    "1": "sample1",
    "2": "sample2",
    "3": "sample3"
  },
  "genome": {
    "1": "hg38",
    "2": "hg38",
    "3": "hg38"
  },
  "path": {
    "1": "data/s1.fastq.gz",
    "2": "data/s2.fastq.gz",
    "3": "data/s3.fastq.gz"
  }
}
```
This function should convert the list of objects into the object of objects.
 */
export const sampleListToObjectofObjects = (samples: Sample[]) => {
  const objectOfObjects: any = {};
  samples.forEach((sample, index) => {
    Object.keys(sample).forEach((key) => {
      if (!objectOfObjects[key]) {
        objectOfObjects[key] = {};
      }
      objectOfObjects[key][index + 1] = sample[key];
    });
  });
  return objectOfObjects;
};
