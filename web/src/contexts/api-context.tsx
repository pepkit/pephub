import axios, { AxiosInstance } from 'axios';
import React, { createContext, useContext } from 'react';

import { useSession } from './session-context';

const VITE_API_HOST = import.meta.env.VITE_API_HOST || '';

type LoginParams = {
  next?: string;
};

type ProviderProps = {
  children: React.ReactNode;
};

const ApiContext = createContext<{
  api: AxiosInstance;
  // @ts-expect-error - its fine to start with undefined
}>(undefined);

export const ApiProvider = ({ children }: ProviderProps) => {
  const { jwt } = useSession();
  const axiosInstance = axios.create({
    baseURL: VITE_API_HOST,
    headers: {
      Authorization: `Bearer ${jwt || 'NOTAUTHORIZED'}`,
    },
  });
  return (
    <ApiContext.Provider
      value={{
        api: axiosInstance,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};
