// Funções pra login, logout, guardar token, essas coisas de autenticação, usando AsyncStorage

import AsyncStorage from "@react-native-async-storage/async-storage";

// Definindo as chaves como constantes para evitar erros de digitação e padronizar com o api.ts
const TOKEN_KEY = "@CareHub:token";
const USER_KEY = "@CareHub:usuario";
const PATIENT_KEY = "@CareHub:paciente";

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
    // Remove o token, utilizador e paciente da sessão de uma só vez
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, PATIENT_KEY]);
    console.log("Sessao encerrada, storage limpo");
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

export async function obterDadosUsuario(): Promise<{ usuario_id?: number; nome?: string; tipo?: string } | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao obter dados do usuario:", e);
    return null;
  }
}