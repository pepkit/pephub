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

  const uniquePhIds = new Set();

  // first row is the header row
  let headerRow = arraysList[0];

  // look for null values, warn user that this
  // may cause issues
  headerRow = headerRow.map((cell, index) => {
    if (!cell) {
      throw new Error(`Empty column header detected at index ${index}.`);
    }
    return cell;
  });

  // look for duplicate values in the header row
  const seen: any = {};
  headerRow.forEach((cell) => {
    if (seen[cell]) {
      throw new Error(`Duplicate column header detected: ${cell}`);
    }
    seen[cell] = true;
  });

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
