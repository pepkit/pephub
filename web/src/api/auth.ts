import axios from 'axios';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const AUTH_BASE = `${API_HOST}/auth`;
const CLIENT_REDIRECT_URL = '/login/success';

type ApiKey = {
  key: string;
  created_at: string;
  expires: string;
};

type UserApiKeysResponse = {
  keys: ApiKey[];
};

type CreateApiKeyResponse = {
  key: ApiKey;
};

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

export const getUserApiKeys = async (jwt: string | null) => {
  if (!jwt) {
    throw new Error('No JWT provided');
  }
  const url = `${AUTH_BASE}/user/keys`;
  const response = await axios.get<UserApiKeysResponse>(url, {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });
  return response.data;
};

export const createNewApiKey = async (jwt: string | null) => {
  if (!jwt) {
    throw new Error('No JWT provided');
  }
  const url = `${AUTH_BASE}/user/keys`;
  const response = await axios.post<CreateApiKeyResponse>(
    url,
    {},
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  );
  return response.data;
};

export const revokeApiKey = async (jwt: string | null, last_five_chars: string) => {
  if (!jwt) {
    throw new Error('No JWT provided');
  }
  const url = `${AUTH_BASE}/user/keys`;
  await axios.delete(url, {
    data: { last_five_chars },
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });
};
