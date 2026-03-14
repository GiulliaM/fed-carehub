import axios from "axios";
import { obterToken } from "../utils/autenticacao";
import { API_URL } from "../config/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

const comAutenticacao = async (config = {}) => {
  const token = await obterToken();
  const headers = (config as any).headers ? { ...(config as any).headers } : {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return { ...(config || {}), headers };
};

// Funções usando async/await pra não dar ruim com interceptor async, rs
export default {
  get: async (url: string, config?: any) => {
    const cfg = await comAutenticacao(config);
    const res = await api.get(url, cfg);
    return res.data;
  },
  post: async (url: string, dados?: any, config?: any) => {
    const cfg = await comAutenticacao(config);
    const res = await api.post(url, dados, cfg);
    return res.data;
  },
  put: async (url: string, dados?: any, config?: any) => {
    const cfg = await comAutenticacao(config);
    const res = await api.put(url, dados, cfg);
    return res.data;
  },
  patch: async (url: string, dados?: any, config?: any) => {
    const cfg = await comAutenticacao(config);
    const res = await api.patch(url, dados, cfg);
    return res.data;
  },
  delete: async (url: string, config?: any) => {
    const cfg = await comAutenticacao(config);
    const res = await api.delete(url, cfg);
    return res.data;
  },
  instanciaAxios: api,
};
