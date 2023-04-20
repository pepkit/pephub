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
