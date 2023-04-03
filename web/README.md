# PEPhub User Interface
This is the user interface for PEPhub. It is a single page application built with [React](https://react.dev) and [Vite](https://vitejs.dev).

## Development
To develop the user interface, you need to have two things running: 1.) the PEPhub server itself, and 2.) The React development server.

**PEPhub server:**  
Follow the instructions in the main [README](../README.md) to start the server.

**React development server:**  
The react development server adds some niceties that make it easy to develop. To begin, ensure you have [Node.js](https://nodejs.org) installed. Then, run the following commands:

```bash
npm install
npm run dev
```

This will start the application at http://127.0.0.1:5173/. Ensure that yor `.env` file is configured to point to the running development server:

```
# .env
VITE_API_BASE=http://localhost:8000/api/v1
VITE_AUTH_BASE=http://localhost:8000/auth
VITE_CLIENT_REDIRECT_URL=/login/success
VITE_SESSION_COOKIE_NAME=pephub_session
```

## Deployment
To deploy the client, simply run `npm run build` to build a production bundle. This will create a `dist` directory that can be served statically. In this example repository, PEPhub is configured to serve the `dist` directory at the root (`/`) of the server.

## Technical Details
This application uses a lot of more modern features and react libraries. Below I outline some of the more important features:

### Bootstrap
We use bootstrap to style and build our interface. This is no different from the previous UI, however, we also have included `react-bootstrap`: a library that allows us to use bootstrap components in our react code. For example, we can use a bootstrap button like this:

```tsx
import { Button } from 'react-bootstrap'

const MyButton = () => {
  return <Button variant="outline-primary">Click me!</Button>
}
```

It is not necessary to use `react-bootstrap`. You can still use HTML tags and native classes, but it does make it easier to build a consistent UI.

### Vite
Vite (pronouced "Veet") is a development tool that comes with a dev server and is used for modern web applications. It offers a faster and smoother workflow in terms of development. It is a replacement for `create-react-app` and `webpack`. It is also the [recommended tool](https://react.dev/learn/start-a-new-react-project#can-i-use-react-without-a-framework) for building React applications. Vite provides a development server that will compile and re-build our user-interface every time we save a file. Finally, it acts as our build tool, and will compile our application into a production bundle to be served off of FastAPI.

For more information on why we use Vite, [see here](https://vitejs.dev/guide/why.html)

### TypeScript
We use TypeScript. Just like we type-annotate our python code, here we type-annotate our JavaScript code too. This helps us catch bugs at compile time, and makes it easier to refactor code. For example:

Say we have a javascript function that fetches a user from the server:

```javascript
const fetchUser = async (id) => {
  const response = await fetch(`/api/users/${id}`)
  const user = await response.json()
  return user
}
```

We can add TypeScript type annotations to this function:

```typescript
interface User {
    id: number,
    name: string,
    email: string,
}

const fetchUser = async (id: number): Promise<User> => {
  const response = await fetch(`/api/users/${id}`)
  const user = await response.json()
  return user
}
```

The `User` interface declares the types of the returned User JSON blob so that subsuquent calls to `fetchUser` get some nice type checking and auto-complete features. While TypeScript can be a bit daunting at first, it is well worth the effort and makes writing JavaScript much more enjoyable.

### `react-router`
`react-router` is a library that allows us to declaratively define the routes of our application. Using `react-router`, we can define routes like this:

```typescript
const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/about",
    element: <AboutPage />
  }
]);
```

Our application is a **single `html` file**. As such, when the user lands at `index.html`, `react-router` will capture the URL and render the appropriate component. This is a very powerful feature that allows us to build a single page application that can be hosted on a static file server. We are essentially using JavaScript to mimic the behavior of a server with defined routes.

### `react-query`
`react-query` is one of those libraries that makes the most sense once you actually use it. According to their documentation:

> Toss out that granular state management, manual refetching and endless bowls of async-spaghetti code. TanStack Query gives you declarative, always-up-to-date auto-managed queries and mutations that directly improve both your developer and user experiences.

Essentially, this library creates very convenient wrappers around our data-fetching code. For example, say we want to fetch a user from the server:

```typescript
const fetchUser = async (id: number): Promise<User> => {
  const response = await fetch(`/api/users/${id}`)
  const user = await response.json()
  return user
}
```

We can wrap this function in `useQuery` like this:

```typescript
const query = useQuery(['user', id], () => fetchUser(id))
```

And we get some really nice objects that can be used to render parts of our UI:

```typescript
if (query.isLoading) {
  return <div>Loading...</div>
} else if (query.error) {
  return <div>Error: {error}</div>
} else {
  return <div>{query.data.name}</div>
}
```

This makes it very easy to write code that is both performant and easy to read. `react-query` removes a ton of the boilerplate that comes with fetching data from a server. Note that this library **caches** API calls. In the above example, `['users', id]` is the **key** that is used to cache the API call. If we call `useQuery` with the same key, it will return the cached value. This is a very powerful feature that allows us to write performant code without having to worry about caching.

### `react-hook-form`
React hook form makes it easy to write forms in native, semantic html without worrying about state, validation, etc. This is another library that just makes so much more sense when you use it.

The following is an example form using `react-hook-form`:

```jsx
import { useForm } from "react-hook-form";

export default function App() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const onSubmit = data => console.log(data);

  console.log(watch("example")); // watch input value by passing the name of it

  return (
    /* "handleSubmit" will validate your inputs before invoking "onSubmit" */
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* register your input into the hook by invoking the "register" function */}
      <input defaultValue="test" {...register("example")} />
      
      {/* include validation with required or other standard HTML validation rules */}
      <input {...register("exampleRequired", { required: true })} />
      {/* errors will return when field validation fails  */}
      {errors.exampleRequired && <span>This field is required</span>}
      
      <input type="submit" />
    </form>
  );
}
```

It lets us focus on the logic and functionality rather than the details of state managment, etc
