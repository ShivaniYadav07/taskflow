import axios from 'axios';

// Calls go to /api/* which Next.js rewrites to the Express backend.
// Same-origin requests automatically include the httpOnly token cookie —
// no Authorization header or localStorage access needed.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url as string | undefined;
    const isAuthRoute = url?.includes('/auth/');

    if (error.response?.status === 401 && !isAuthRoute && typeof window !== 'undefined') {
      // Clear cached display data and redirect — the httpOnly cookie is cleared by the server on logout
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
