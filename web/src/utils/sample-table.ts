export const tableDataToCsvString = (headers: string[], tableData: any[][]) => {
  const csvRows: string[] = [];
  csvRows.push(headers.join(','));
  debugger;
  tableData.forEach((row) => {
    csvRows.push(row.join(','));
  });
  return csvRows.join('\n');
};
