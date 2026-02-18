import axios from 'axios';

const api = axios.create({
  baseURL: '', // Use relative path to leverage Vite proxy
});

export default api;
