export const tableDataToCsvString = (tableData: any[][]) => {
  const csvRows: string[] = [];
  tableData.forEach((row) => {
    // ignore rows containing only empty strings
    if (row.every((cell) => !cell)) {
      return;
    }
    // sometimes there are commas INSIDE the actual cell,
    // and we want to preserve that relationship, while
    // updating the csvRows array
    const csvRow = row.map((cell: any) => {
      if (cell && cell.includes(',')) {
        return `"${cell}"`;
      } else {
        return cell;
      }
    });
    csvRows.push(csvRow.join(','));
  });
  let csvString = csvRows.join('\n');
  // remove leading and trailing whitespace
  csvString = csvString.trim();
  return csvString;
};
