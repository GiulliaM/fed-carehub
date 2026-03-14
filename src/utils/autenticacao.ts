
// Funções pra login, logout, guardar token, essas coisas de autenticação, usando AsyncStorage

import AsyncStorage from "@react-native-async-storage/async-storage";

export async function salvarToken(token: string) {
  try {
    await AsyncStorage.setItem("token", token);
  } catch (e) {
    console.error("Erro ao salvar token:", e);
  }
}

export async function obterToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem("token");
    return token;
  } catch (e) {
    console.error("Erro ao obter token:", e);
    return null;
  }
}

export async function sair() {
  try {
    await AsyncStorage.multiRemove(["token", "usuario", "paciente"]);
    console.log("Sessao encerrada, storage limpo");
  } catch (e) {
    console.error("Erro ao remover dados da sessao:", e);
  }
}

export async function salvarDadosUsuario(user: { usuario_id?: number; nome?: string; tipo?: string }) {
  try {
    await AsyncStorage.setItem("usuario", JSON.stringify(user));
  } catch (e) {
    console.error("Erro ao salvar dados do usuario:", e);
  }
}

export async function obterDadosUsuario(): Promise<{ usuario_id?: number; nome?: string; tipo?: string } | null> {
  try {
    const raw = await AsyncStorage.getItem("usuario");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao obter dados do usuario:", e);
    return null;
  }
}
