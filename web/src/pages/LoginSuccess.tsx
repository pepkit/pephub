import { FC, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { exchangeCodeForToken } from '../api/auth';
import { SEO } from '../components/layout/seo';
import { useSession } from '../contexts/session-context';

export const LoginSuccessPage: FC = () => {
  const navigate = useNavigate();
  const { setJWT } = useSession();
  const [searchParams, _] = useSearchParams();
  let authCode = searchParams.get('code');
  let redirect = searchParams.get('client_finally_send_to');

  // strip all but the path segment + /login/success
  if (redirect) {
    redirect = redirect.replace(/^(?:\/\/|[^/]+)*\//, '');

    // add back the leading slash
    if (!redirect.startsWith('/')) {
      redirect = '/' + redirect;
    }
  }

  useEffect(() => {
    if (authCode) {
      exchangeCodeForToken(authCode)
        .then((res) => res.data)
        .then((data) => {
          setJWT(data.token);
          navigate(redirect || '/');
        })
        .finally(() => {
          navigate(redirect || '/');
        });
    }
  }, [authCode, navigate, setJWT]);

  return (
    <>
      <SEO title="Login success" />
      <div className="h-screen d-flex flex-column align-items-center justify-content-center">
        <img className="bounce" src="/pep-dark.svg" width="75px" height="75px" />
        <p className="h5">Success. Logging you in...</p>
        <p>
          If you are not redirected in 10 seconds, <a href="/">click here</a> .
        </p>
      </div>
    </>
  );
};
