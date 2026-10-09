import axios from 'axios';
import { getToken, removeToken, removeUser } from './auth';
import { emitUnauthorized } from './authEvents';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();
      await removeUser();
      // Notifica al AuthContext para que limpie el estado en memoria;
      // RootNavigator redirige solo al ver user === null.
      emitUnauthorized();
    }
    return Promise.reject(error);
  },
);

export default api;
