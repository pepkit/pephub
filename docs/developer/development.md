# PEPhub development

## Introduction

_The following assumes you have already setup a database. If you have not, please see [here](#1-database-setup)._

There are two components to PEPhub: a FastAPI backend, and a React frontend. As such, when developing, you will need to run both the backend and frontend development servers. Full API documentation can be found at https://pephub-api.databio.org/api/v1/docs.

## Backend development

`uvicorn` is used to run the backend development server. To start the backend server, run the following:

```bash
uvicorn pephub.main:app --reload
```

The backend server should now be running at http://localhost:8000. If you wish to debug the backend server, the repository contains a `launch.json` file for VSCode. You can use this to debug the backend server.

## Frontend development
*Before beginning, ensure you are using a `nodejs` version > 16.* To manage `node` versions, most people recommend [`nvm`](https://github.com/nvm-sh/nvm).

We use [vite](https://vitejs.dev/) as our development and build tool for the frontend. Before starting, make sure you point the development server at the already running backend server. To do this, create a `.env.local` file inside the `web/` directory with the following contents:

```
VITE_API_HOST=http://localhost:8000
```

Now, to start the frontend development server `cd` into the `web/` directory, and run the following:

```bash
npm install # yarn install
npm start # yarn dev
```

The frontend development server should now be running at http://localhost:5173/. The React development server comes with a lot of nice features, such as hot reloading, and debugging. You can read more about these features [here](https://vitejs.dev/guide/features.html).
