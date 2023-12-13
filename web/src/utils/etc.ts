import { AxiosError } from 'axios';

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

type OS = 'Mac OS' | 'iOS' | 'Windows' | 'Android' | 'Linux' | 'Unknown';

export const getOS = (): OS => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];

  if (macosPlatforms.indexOf(platform) !== -1) {
    return 'Mac OS';
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    return 'iOS';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    return 'Windows';
  } else if (/Android/.test(userAgent)) {
    return 'Android';
  } else if (!platform && /Linux/.test(platform)) {
    return 'Linux';
  }
  return 'Unknown';
};

export const extractErrorMessage = (err: AxiosError): string => {
  const ERROR_MESSAGE_KEY = 'detail';

  // extract out error message if it exists, else unknown
  const data = err.response?.data;
  if (data && typeof data === 'object' && ERROR_MESSAGE_KEY in data) {
    return data[ERROR_MESSAGE_KEY] as string;
  } else if (data && typeof data === 'string') {
    return data;
  }
  return 'Unknown error occured.';
};

export const extractError = (err: AxiosError): string => {
  // extract out error message if it exists, else unknown
  const data = err.response?.data;
  if (data && typeof data === 'object' && 'error' in data) {
    return data.error as string;
  } else if (data && typeof data === 'string') {
    return data;
  }
  return 'Unknown';
};

// function to add commas to numbers
export const numberWithCommas = (x: number): string => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
