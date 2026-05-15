import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'https://legacyofthevaliant.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@CareHub:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error("[API] Erro ao buscar token no Storage", e);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error(`[API] servidor inacessivel: ${API_URL}`);
    }
    return Promise.reject(error);
  }
);

export default api;