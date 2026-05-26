// Notificações desativadas temporariamente
import AsyncStorage from "@react-native-async-storage/async-storage";

// import * as Notifications from "expo-notifications";
// import { Platform } from "react-native";

// const PREF_ATIVO = "notificacoes_lembrete_ativo";
// const CANAL_ID = "carehub-lembretes";

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

export async function configurarCanal(): Promise<boolean> {
  return false;
}

export async function notificacoesLembreteAtivas(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem("notificacoes_lembrete_ativo");
    return v !== "false";
  } catch {
    return true;
  }
}

export async function setNotificacoesLembreteAtivas(ativo: boolean): Promise<void> {
  await AsyncStorage.setItem("notificacoes_lembrete_ativo", ativo ? "true" : "false");
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
