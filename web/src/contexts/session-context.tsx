import { useQuery } from '@tanstack/react-query';
import jwt_decode from 'jwt-decode';
import React, { createContext, useCallback, useContext } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { User } from '../../types';
import { buildClientRedirectUrl } from '../api/auth';

const VITE_API_HOST = import.meta.env.VITE_API_HOST || '';
const AUTH_BASE = `${VITE_API_HOST}/auth`;
const JWT_STORE = 'pephub_session';

type LoginParams = {
  next?: string;
};

type ProviderProps = {
  children: React.ReactNode;
};

const SessionContext = createContext<{
  jwt: string | null;
  user: User | null;
  login: (params?: LoginParams) => void;
  logout: () => void;
  setJWT: (jwt: string | null) => void;
  // @ts-expect-error - its fine to start with undefined
}>(undefined);

export const SessionProvider = ({ children }: ProviderProps) => {
  const [jwt, setJwt] = useLocalStorage<string | null>(JWT_STORE, null);

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
    refetchOnWindowFocus: true,
  });

  let decoded = null;

  const login = useCallback(
    (params?: LoginParams) => {
      const clientRedirectUrl = buildClientRedirectUrl();
      const currentUrl = window.location.href;
      let final = currentUrl;
      if (params?.next) {
        final = params?.next;
      }
      const url = `${AUTH_BASE}/login?client_redirect_uri=${clientRedirectUrl}&client_finally_send_to=${final}`;
      window.location.href = url;
    },
    [AUTH_BASE, buildClientRedirectUrl, window.location.href],
  );

  const logout = useCallback(() => {
    setJwt(null);
    // reload the page for UX
    window.location.reload();
  }, [setJwt, JWT_STORE]);
  // const logout = () => {};

  // decode the session cookie
  if (jwt) {
    decoded = jwt_decode(jwt) as User;
  }

  return (
    <SessionContext.Provider
      value={{
        jwt,
        user: decoded || null,
        login,
        logout,
        setJWT: setJwt as (jwt: string | null) => void,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
