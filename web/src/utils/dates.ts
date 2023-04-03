export const dateStringToDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

export const dateStringToDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
