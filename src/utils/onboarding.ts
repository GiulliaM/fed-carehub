// Controle do tutorial de boas-vindas: guarda no AsyncStorage se o usuario ja viu

import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIXO = "@CareHub:onboarding_visto";

// chave por usuario, pra que cada conta nova veja o tutorial uma vez
function chave(userId?: number | string | null) {
  return userId ? `${PREFIXO}:${userId}` : PREFIXO;
}

export async function onboardingFoiVisto(userId?: number | string | null): Promise<boolean> {
  try {
    const valor = await AsyncStorage.getItem(chave(userId));
    return valor === "true";
  } catch (e) {
    console.error("Erro ao ler onboarding:", e);
    // em caso de erro nao atrapalha o usuario: trata como ja visto
    return true;
  }
}

export async function marcarOnboardingVisto(userId?: number | string | null) {
  try {
    await AsyncStorage.setItem(chave(userId), "true");
  } catch (e) {
    console.error("Erro ao marcar onboarding como visto:", e);
  }
}

// usado caso futuramente queira um botao "rever tutorial"
export async function resetarOnboarding(userId?: number | string | null) {
  try {
    await AsyncStorage.removeItem(chave(userId));
  } catch (e) {
    console.error("Erro ao resetar onboarding:", e);
  }
}
