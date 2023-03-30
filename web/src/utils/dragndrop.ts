import { UseFormSetValue } from 'react-hook-form';

// pass in react-hook-form setter
export const popFileFromFileList = (fileList: FileList, index: number, setter: UseFormSetValue<any>) => {
  const files = Array.from(fileList);
  const file = files[index];
  files.splice(index, 1);
  if (files.length === 0) {
    setter('files', undefined);
  } else {
    setter('files', files);
  }
};
