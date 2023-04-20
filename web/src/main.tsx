import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './pages/Home';

// routing
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { NamespacePage } from './pages/Namespace';
import { ProjectPage } from './pages/Project';
import { LoginSuccessPage } from './pages/LoginSuccess';
import { SearchPage } from './pages/Search';
import { EditProjectPage } from './pages/EditProject';
import { EidoValidator } from './pages/Validator';

// notifications
import { Toaster } from 'react-hot-toast';

// react query stuff
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// handsontable stuff
import { registerAllModules } from 'handsontable/registry';
registerAllModules();

// css
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'handsontable/dist/handsontable.full.min.css';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
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
    element: <ProjectPage />,
  },
  {
    path: '/:namespace/:project/edit',
    element: <EditProjectPage />,
  },
]);

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster position="top-right" reverseOrder={false} gutter={8} toastOptions={{ duration: 3000 }} />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </HelmetProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
