import AsyncStorage from "@react-native-async-storage/async-storage";

const PREF_ATIVO = "notificacoes_lembrete_ativo";

// Notificações desabilitadas temporariamente — expo-notifications SDK 53 causa
// crash nativo no Expo Go ao ser importado. Reativar após migrar para dev build/APK.

export async function configurarCanal(): Promise<boolean> {
  return false;
}

export async function notificacoesLembreteAtivas(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(PREF_ATIVO);
    return v !== "false";
  } catch {
    return true;
  }
}

export async function setNotificacoesLembreteAtivas(ativo: boolean): Promise<void> {
  await AsyncStorage.setItem(PREF_ATIVO, ativo ? "true" : "false");
}

export async function agendarLembreteTarefa(
  _tarefaId: number,
  _titulo: string,
  _data: string,
  _hora: string | null
): Promise<string | null> {
  return null;
}

export async function cancelarLembreteTarefa(_tarefaId: number): Promise<void> {}

export async function agendarLembreteMedicamento(
  _medicamentoId: number,
  _nome: string,
  _horario: string
): Promise<string | null> {
  return null;
}

export async function cancelarLembreteMedicamento(
  _medicamentoId: number,
  _horario: string
): Promise<void> {}

export async function cancelarTodosLembretes(): Promise<void> {}

export async function obterERegistrarPushToken(): Promise<void> {}
