import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[Axios] 401 Unauthorized. Token expired or invalid. Logging out.');
      localStorage.removeItem('token');
      // Force reload to let AuthContext and React Router handle redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
