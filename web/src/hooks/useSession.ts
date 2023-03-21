import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { buildClientRedirectUrl } from '../api/auth';

const AUTH_BASE = import.meta.env.VITE_AUTH_BASE;

export const useSession = () => {
  const navigate = useNavigate();
  const [cookies, setCookie, removeCookie] = useCookies(['session']);
  let decoded = null;

  const login = () => {
    const clientRedirectUrl = buildClientRedirectUrl();
    const url = `${AUTH_BASE}/login?client_redirect_uri=${clientRedirectUrl}`;
    window.location.href = url;
  };

  const logout = () => {
    removeCookie('session');
  };

  const setJWT = (jwt: string, expires: number = 4320) => {
    // converts minutes to milliseconds
    setCookie('session', jwt, { path: '/', expires: new Date(Date.now() + expires * 60 * 1000) });
  };

  // decode the session cookie
  if (cookies.session) {
    decoded = jwt_decode(cookies.session);
  }
  return {
    jwt: cookies.session,
    user: decoded,
    login,
    logout,
    setJWT,
  };
};
