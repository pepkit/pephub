import jwt_decode from 'jwt-decode';
import { useCookies } from 'react-cookie';
import { buildClientRedirectUrl } from '../api/auth';

const AUTH_BASE = import.meta.env.VITE_AUTH_BASE;
const SESSION_COOKIE_NAME = import.meta.env.VITE_SESSION_COOKIE_NAME;

export const useSession = () => {
  const [cookies, setCookie, removeCookie] = useCookies([SESSION_COOKIE_NAME]);
  let decoded = null;

  const login = () => {
    const clientRedirectUrl = buildClientRedirectUrl();
    const url = `${AUTH_BASE}/login?client_redirect_uri=${clientRedirectUrl}`;
    window.location.href = url;
  };

  const logout = () => {
    removeCookie(SESSION_COOKIE_NAME);
  };

  const setJWT = (jwt: string, expires: number = 4320) => {
    // converts minutes to milliseconds
    setCookie(SESSION_COOKIE_NAME, jwt, { path: '/', expires: new Date(Date.now() + expires * 60 * 1000) });
  };

  // decode the session cookie
  if (cookies[SESSION_COOKIE_NAME]) {
    decoded = jwt_decode(cookies[SESSION_COOKIE_NAME]);
  }
  return {
    jwt: cookies[SESSION_COOKIE_NAME],
    user: decoded,
    login,
    logout,
    setJWT,
  };
};
