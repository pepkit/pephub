export const dateStringToDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

export const dateStringToDate = (dateString: string) => {
  const date = new Date(dateString);
  // give full month name
  return date.toLocaleString('default', { month: 'long' }) + ' ' + date.getDate() + ', ' + date.getFullYear();
};
