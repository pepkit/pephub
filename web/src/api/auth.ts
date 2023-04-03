import axios from 'axios';

const AUTH_BASE = import.meta.env.VITE_AUTH_BASE;
const CLIENT_REDIRECT_URL = import.meta.env.VITE_CLIENT_REDIRECT_URL;

export const buildClientRedirectUrl = (): string => {
  const scheme = window.location.protocol;
  const url = `${scheme}//${window.location.host}${CLIENT_REDIRECT_URL}`;
  return url;
};

export const exchangeCodeForToken = async (code: string) => {
  const url = `${AUTH_BASE}/token`;
  const clientRedirectUrl = buildClientRedirectUrl();
  return axios.post(url, { code: code, client_redirect_uri: clientRedirectUrl });
};
