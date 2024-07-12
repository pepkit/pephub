// react query stuff
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import 'bootstrap-icons/font/bootstrap-icons.css';
// css
import 'bootstrap/dist/css/bootstrap.min.css';
import 'handsontable/dist/handsontable.full.min.css';
// Language
// handsontable stuff
import { registerAllModules } from 'handsontable/registry';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
// notifications
import { Toaster } from 'react-hot-toast';
// routing
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

// custom contexts
import { ProjectPageProvider } from './contexts/project-page-context';
import { SessionProvider } from './contexts/session-context';
import './globals.css';
import { Home } from './pages/Home';
import { LoginSuccessPage } from './pages/LoginSuccess';
import { NamespacePage } from './pages/Namespace';
import { ProjectPage } from './pages/Project';
import { SearchPage } from './pages/Search';
import { EidoValidator } from './pages/Validator';

registerAllModules();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/search',
    element: <SearchPage />,
  },
  {
    path: '/validate',
    element: <EidoValidator />,
  },

  {
    path: '/login/success',
    element: <LoginSuccessPage />,
  },
  {
    path: '/:namespace',
    element: <NamespacePage />,
  },
  {
    path: '/:namespace/:project',
    element: (
      <ProjectPageProvider>
        <ProjectPage />
      </ProjectPageProvider>
    ),
  },
]);

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" reverseOrder={false} gutter={8} toastOptions={{ duration: 3000 }} />
            <ReactQueryDevtools initialIsOpen={false} />
          </SessionProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
