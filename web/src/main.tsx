import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './pages/Home';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import { NamespacePage } from './pages/Namespace';
import { ProjectPage } from './pages/Project';
import { LoginSuccessPage } from './pages/LoginSuccess';
import { Toaster } from 'react-hot-toast';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
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
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" reverseOrder={false} gutter={8} />
    </HelmetProvider>
  </React.StrictMode>,
);
