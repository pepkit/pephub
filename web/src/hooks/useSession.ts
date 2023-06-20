import { User } from '../../types';
import { useCallback } from 'react';
import jwt_decode from 'jwt-decode';
import { buildClientRedirectUrl } from '../api/auth';
import { useLocalStorage } from './useLocalStorage';

const VITE_API_HOST = import.meta.env.VITE_API_HOST || '';
const AUTH_BASE = `${VITE_API_HOST}/auth`;
const JWT_STORE = 'pephub_session';

export const useSession = () => {
  const [jwt, setJwt] = useLocalStorage(JWT_STORE, null);
  let decoded = null;

  const login = useCallback(() => {
    const clientRedirectUrl = buildClientRedirectUrl();
    const url = `${AUTH_BASE}/login?client_redirect_uri=${clientRedirectUrl}`;
    window.location.href = url;
  }, [AUTH_BASE, buildClientRedirectUrl]);

  const logout = useCallback(() => {
    setJwt(null);
    window.location.reload();
  }, [setJwt, JWT_STORE]);

  // decode the session cookie
  if (jwt) {
    decoded = jwt_decode(jwt) as User;
  }

  return {
    jwt,
    user: decoded || null,
    login,
    logout,
    setJWT: setJwt,
  };
};
