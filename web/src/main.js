"use strict";
exports.__esModule = true;
// react query stuff
var react_query_1 = require("@tanstack/react-query");
var react_query_devtools_1 = require("@tanstack/react-query-devtools");
require("bootstrap-icons/font/bootstrap-icons.css");
// css
require("bootstrap/dist/css/bootstrap.min.css");
require("handsontable/dist/handsontable.full.min.css");
// handsontable stuff
var registry_1 = require("handsontable/registry");
var react_1 = require("react");
var client_1 = require("react-dom/client");
var react_helmet_async_1 = require("react-helmet-async");
// notifications
var react_hot_toast_1 = require("react-hot-toast");
// routing
var react_router_dom_1 = require("react-router-dom");
require("./globals.css");
var Home_1 = require("./pages/Home");
var About_1 = require("./pages/About");
var LoginSuccess_1 = require("./pages/LoginSuccess");
var Namespace_1 = require("./pages/Namespace");
var Project_1 = require("./pages/Project");
var Search_1 = require("./pages/Search");
var Validator_1 = require("./pages/Validator");
registry_1.registerAllModules();
var queryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1
        }
    }
});
var router = react_router_dom_1.createBrowserRouter([
    {
        path: '/',
        element: <Home_1["default"] />
    },
    {
        path: '/about',
        element: <About_1["default"] />
    },
    {
        path: '/search',
        element: <Search_1.SearchPage />
    },
    {
        path: '/validate',
        element: <Validator_1.EidoValidator />
    },
    {
        path: '/login/success',
        element: <LoginSuccess_1.LoginSuccessPage />
    },
    {
        path: '/:namespace',
        element: <Namespace_1.NamespacePage />
    },
    {
        path: '/:namespace/:project',
        element: <Project_1.ProjectPage />
    },
]);
var App = function () {
    return (<react_1["default"].StrictMode>
      <react_helmet_async_1.HelmetProvider>
        <react_query_1.QueryClientProvider client={queryClient}>
          <react_router_dom_1.RouterProvider router={router}/>
          <react_hot_toast_1.Toaster position="top-right" reverseOrder={false} gutter={8} toastOptions={{ duration: 3000 }}/>
          <react_query_devtools_1.ReactQueryDevtools initialIsOpen={false}/>
        </react_query_1.QueryClientProvider>
      </react_helmet_async_1.HelmetProvider>
    </react_1["default"].StrictMode>);
};
client_1["default"].createRoot(document.getElementById('root')).render(<App />);
