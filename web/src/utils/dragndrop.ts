// pass in react-hook-form setter
export const popFileFromFileList = (
  fileList: FileList,
  index: number,
  setter: (files: FileList | undefined) => void,
) => {
  const files = Array.from(fileList);

  // remove file at index
  const newFiles = files.filter((_, i) => i !== index);

  if (newFiles.length === 0) {
    // create empty file list
    setter(undefined);
  } else {
    // convert back to FileList
    const fileList = new DataTransfer();
    for (let i = 0; i < newFiles.length; i++) {
      fileList.items.add(newFiles[i]);
    }
    setter(fileList.files);
  }
};
