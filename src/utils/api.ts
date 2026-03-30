import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const apiTwo = axios.create({
  baseURL: import.meta.env.VITE_API_URL2,
});

// Reusable interceptor
const requestInterceptor = (config) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

const errorInterceptor = (error) => {
  return Promise.reject(error);
};

// Apply interceptor to both instances
api.interceptors.request.use(requestInterceptor, errorInterceptor);
apiTwo.interceptors.request.use(requestInterceptor, errorInterceptor);

export default api;