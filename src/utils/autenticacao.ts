// Funções pra login, logout, guardar token, essas coisas de autenticação, usando AsyncStorage

import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@CareHub:token";
const USER_KEY = "usuario";
const PATIENT_KEY = "paciente";

export async function salvarToken(token: string) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error("Erro ao salvar token:", e);
  }
}

export async function obterToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch (e) {
    console.error("Erro ao obter token:", e);
    return null;
  }
}

export async function sair() {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, PATIENT_KEY, "paciente_ativo_id"]);
  } catch (e) {
    console.error("Erro ao remover dados da sessao:", e);
  }
}

export async function salvarDadosUsuario(user: { usuario_id?: number; nome?: string; tipo?: string }) {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error("Erro ao salvar dados do usuario:", e);
  }
}

export async function obterDadosUsuario(): Promise<{ usuario_id?: number; nome?: string; tipo?: string; foto_url?: string } | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao obter dados do usuario:", e);
    return null;
  }
}

const SERVER_BASE = "https://legacyofthevaliant.com";

export function normalizarFotoUrl(url: string | null | undefined): string {
  if (!url || url.startsWith("file://")) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${SERVER_BASE}${url}`;
  return `${SERVER_BASE}/${url}`;
}