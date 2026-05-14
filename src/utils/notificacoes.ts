import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const PREF_ATIVO = "notificacoes_lembrete_ativo";
const CANAL_ID = "carehub-lembretes";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function configurarCanal(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CANAL_ID, {
      name: "Lembretes",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }

  return true;
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
  tarefaId: number,
  titulo: string,
  data: string,   // "YYYY-MM-DD"
  hora: string | null  // "HH:MM:00" ou null
): Promise<string | null> {
  if (!(await notificacoesLembreteAtivas()) || !hora) return null;

  const [ano, mes, dia] = data.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  const trigger = new Date(ano, mes - 1, dia, hh, mm, 0);
  if (trigger <= new Date()) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Tarefa pendente",
        body: titulo,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
        channelId: CANAL_ID,
      },
    });
    await AsyncStorage.setItem(`notif_tarefa_${tarefaId}`, id);
    return id;
  } catch {
    return null;
  }
}

export async function cancelarLembreteTarefa(tarefaId: number): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(`notif_tarefa_${tarefaId}`);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(`notif_tarefa_${tarefaId}`);
    }
  } catch {}
}

export async function agendarLembreteMedicamento(
  medicamentoId: number,
  nome: string,
  horario: string  // "HH:MM"
): Promise<string | null> {
  if (!(await notificacoesLembreteAtivas())) return null;

  const [hh, mm] = horario.split(":").map(Number);
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hora do medicamento",
        body: nome,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hh,
        minute: mm,
        channelId: CANAL_ID,
      },
    });
    await AsyncStorage.setItem(`notif_med_${medicamentoId}_${horario}`, id);
    return id;
  } catch {
    return null;
  }
}

export async function cancelarLembreteMedicamento(
  medicamentoId: number,
  horario: string
): Promise<void> {
  try {
    const key = `notif_med_${medicamentoId}_${horario}`;
    const id = await AsyncStorage.getItem(key);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(key);
    }
  } catch {}
}

export async function cancelarTodosLembretes(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export async function obterERegistrarPushToken(): Promise<void> {
  // Push token para notificações remotas — não utilizado nesta versão
}
