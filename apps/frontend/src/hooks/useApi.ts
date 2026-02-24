import axios, { AxiosInstance } from 'axios';
import { useMemo } from 'react';

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
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL:
        import.meta.env.VITE_SERVICE_URL ?? 'http://localhost:3000',
      headers: {
        'correlation-id': crypto.randomUUID(),
      },
    });

    instance.interceptors.response.use(null, responseErrorHandler);

    return instance;
  }, []);

  return { api };
}
