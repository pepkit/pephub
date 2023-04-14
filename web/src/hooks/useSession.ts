import { User } from '../../types';
import { useCallback } from 'react';
import jwt_decode from 'jwt-decode';
import { useCookies } from 'react-cookie';
import { buildClientRedirectUrl } from '../api/auth';

const VITE_API_HOST = import.meta.env.VITE_API_HOST || '';
const AUTH_BASE = `${VITE_API_HOST}/auth`;
const SESSION_COOKIE_NAME = 'pephub_session';

export const useSession = () => {
  const [cookies, setCookie, removeCookie] = useCookies([SESSION_COOKIE_NAME]);
  let decoded = null;

  const login = useCallback(() => {
    const clientRedirectUrl = buildClientRedirectUrl();
    const url = `${AUTH_BASE}/login?client_redirect_uri=${clientRedirectUrl}`;
    window.location.href = url;
  }, [AUTH_BASE, buildClientRedirectUrl]);

  const logout = useCallback(() => {
    removeCookie(SESSION_COOKIE_NAME, { path: '/' });
    window.location.reload();
  }, [removeCookie, SESSION_COOKIE_NAME]);

  const setJWT = (jwt: string, expires: number = 4320) => {
    // converts minutes to milliseconds
    setCookie(SESSION_COOKIE_NAME, jwt, { path: '/', expires: new Date(Date.now() + expires * 60 * 1000) });
  };

  // decode the session cookie
  if (cookies[SESSION_COOKIE_NAME]) {
    decoded = jwt_decode(cookies[SESSION_COOKIE_NAME]) as User;
  }
  return {
    jwt: (cookies[SESSION_COOKIE_NAME] as string) || null,
    user: decoded || null,
    login,
    logout,
    setJWT,
  };
};
