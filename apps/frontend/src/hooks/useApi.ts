import axios, { AxiosInstance } from 'axios';
import { useMemo } from 'react';
import { useAuth as useOidcAuth } from 'react-oidc-context';

import { showApiError } from '../utils/notification';

const responseErrorHandler = (error: unknown) => {
  if (
    axios.isCancel(error) ||
    (error as { code?: string })?.code === 'ERR_CANCELED'
  ) {
    return Promise.reject(error);
  }

  showApiError();
  return Promise.reject(error);
};

export function useApi(): { api: AxiosInstance } {
  const auth = useOidcAuth();
  const accessToken = auth.user?.access_token ?? null;

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL:
        import.meta.env.VITE_SERVICE_URL ?? 'http://localhost:3000',
      headers: {
        'correlation-id': crypto.randomUUID(),
      },
      // No longer need withCredentials — we send a Bearer token instead of cookies
    });

    // Attach access token to every request
    instance.interceptors.request.use((config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    instance.interceptors.response.use(null, responseErrorHandler);

    return instance;
  }, [accessToken]);

  return { api };
}
