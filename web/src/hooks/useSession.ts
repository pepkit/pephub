import { useQuery } from '@tanstack/react-query';
import jwt_decode from 'jwt-decode';
import { useCallback } from 'react';

import { User } from '../../types';
import { buildClientRedirectUrl } from '../api/auth';
import { useLocalStorage } from './useLocalStorage';

const VITE_API_HOST = import.meta.env.VITE_API_HOST || '';
const AUTH_BASE = `${VITE_API_HOST}/auth`;
const JWT_STORE = 'pephub_session';

interface Session {
  jwt: string | null;
  user: User | null;
  login: () => void;
  logout: () => void;
  setJWT: (jwt: string | null) => void;
}

export const useSession = (): Session => {
  const [jwt, setJwt] = useLocalStorage(JWT_STORE, null);

  // hit endpoint to check if the session is valid
  // if not, clear the session
  const {} = useQuery({
    queryKey: ['session', jwt],
    queryFn: async () => {
      if (!jwt) return null;
      const response = await fetch(`${AUTH_BASE}/session`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 401) {
        setJwt(null);
        // reload page to clear session
        window.location.reload();
        return null;
      }
      return response.json();
    },
    enabled: !!jwt,
  });

  let decoded = null;

  const login = useCallback(() => {
    const clientRedirectUrl = buildClientRedirectUrl();
    const currentUrl = window.location.href;
    const url = `${AUTH_BASE}/login?client_redirect_uri=${clientRedirectUrl}&client_finally_send_to=${currentUrl}`;
    window.location.href = url;
  }, [AUTH_BASE, buildClientRedirectUrl, window.location.href]);

  const logout = useCallback(() => {
    setJwt(null);
    // reload the page for UX
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
    setJWT: setJwt as (jwt: string | null) => void,
  };
};
