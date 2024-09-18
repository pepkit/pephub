export const dateStringToDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'long', year: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second:'numeric'});
};

export const dateStringToDateTimeShort = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'short', year: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second:'numeric'});
};

export const dateStringToDate = (dateString: string) => {
  const date = new Date(dateString);
  // give full month name
  return date.toLocaleString('default', { month: 'long' }) + ' ' + date.getDate() + ', ' + date.getFullYear();
};
