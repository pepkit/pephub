import axios from 'axios';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const AUTH_BASE = `${API_HOST}/auth`;
const CLIENT_REDIRECT_URL = '/login/success';

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
