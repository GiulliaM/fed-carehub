import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Para pegar o token salvo

// IP atualizado da VPS via Tailscale (vimos no ipconfig)
export const API_URL = 'http://100.111.0.122:3000/api'; 

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, 
});

// NOVO: Interceptor para colocar o TOKEN em todas as chamadas
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

// Seu interceptor de erros (mantido porque está ótimo!)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error(`[API] Network Error — Servidor inacessível em: ${API_URL}`);
      console.error('[API] Verifique: (1) backend está rodando, (2) IP correto, (3) firewall/porta aberta');
    }
    return Promise.reject(error);
  }
);

export default api;