import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE;
const CLIENT_REDIRECT_URL = import.meta.env.VITE_CLIENT_REDIRECT_URL;

export const buildClientRedirectUrl = (): string => {
  const url = `${window.location.host}${CLIENT_REDIRECT_URL}`;
  return url;
};

export const exchangeCodeForToken = async (code: string) => {
  const url = `${API_BASE}/auth/token`;
  const clientRedirectUrl = buildClientRedirectUrl();
  return axios.post(url, { code: code, client_redirect_uri: clientRedirectUrl });
};
