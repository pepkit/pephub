// pass in react-hook-form setter
export const popFileFromFileList = (fileList: FileList, index: number, setter: (files: FileList) => void) => {
  const files = Array.from(fileList);
  files.splice(index, 1);
  if (files.length === 0) {
    // create empty file list
    setter(new DataTransfer().files);
  } else {
    // convert back to FileList
    const fileList = new DataTransfer();
    for (let i = 0; i < files.length; i++) {
      fileList.items.add(files[i]);
    }
    setter(fileList.files);
  }
};
