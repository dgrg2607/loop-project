import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

// Listens for the window events dispatched by api/axios.js and turns them
// into either a toast (generic API error) or a forced logout + redirect
// (expired/invalid session). Mounted once near the root of the app.
export default function GlobalErrorListener() {
  const toast = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onError = (e) => toast.error(e.detail);
    const onUnauthorized = () => {
      logout();
      navigate('/login');
      toast.info('Your session expired — please sign in again.');
    };
    window.addEventListener('loop:api-error', onError);
    window.addEventListener('loop:unauthorized', onUnauthorized);
    return () => {
      window.removeEventListener('loop:api-error', onError);
      window.removeEventListener('loop:unauthorized', onUnauthorized);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
