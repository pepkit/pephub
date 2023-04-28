export const tableDataToCsvString = (tableData: any[][]) => {
  const csvRows: string[] = [];
  tableData.forEach((row) => {
    csvRows.push(row.join(','));
  });
  return csvRows.join('\n');
};
