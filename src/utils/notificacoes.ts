import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return false;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CANAL_ID, {
        name: "Lembretes CareHub",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    return true;
  } catch {
    return false;
  }
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
  if (!ativo) await cancelarTodosLembretes();
}

// dispara todo dia no horario do medicamento
export async function agendarLembreteMedicamento(
  medicamentoId: number,
  nome: string,
  horario: string
): Promise<string | null> {
  try {
    const ativo = await notificacoesLembreteAtivas();
    if (!ativo) return null;

    const chave = `notif_med_${medicamentoId}_${horario}`;
    const existente = await AsyncStorage.getItem(chave);
    if (existente) return existente;

    const partes = String(horario).split(":");
    const hh = parseInt(partes[0], 10);
    const mm = parseInt(partes[1] ?? "0", 10);
    if (isNaN(hh) || isNaN(mm)) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hora do medicamento",
        body: nome,
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hh,
        minute: mm,
        channelId: CANAL_ID,
      },
    });
    await AsyncStorage.setItem(chave, id);
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
    const chave = `notif_med_${medicamentoId}_${horario}`;
    const id = await AsyncStorage.getItem(chave);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(chave);
    }
  } catch {}
}

// dispara uma vez na data+hora da tarefa
export async function agendarLembreteTarefa(
  tarefaId: number,
  titulo: string,
  data: string,
  hora: string | null
): Promise<string | null> {
  try {
    if (!hora) return null;
    const ativo = await notificacoesLembreteAtivas();
    if (!ativo) return null;

    const chave = `notif_tarefa_${tarefaId}`;
    const existente = await AsyncStorage.getItem(chave);
    if (existente) return existente;

    const [ano, mes, dia] = data.split("-").map(Number);
    const [hh, mm] = hora.split(":").map(Number);
    const dataNotif = new Date(ano, mes - 1, dia, hh, mm, 0);
    if (dataNotif <= new Date()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Tarefa",
        body: titulo,
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dataNotif,
        channelId: CANAL_ID,
      },
    });
    await AsyncStorage.setItem(chave, id);
    return id;
  } catch {
    return null;
  }
}

export async function cancelarLembreteTarefa(tarefaId: number): Promise<void> {
  try {
    const chave = `notif_tarefa_${tarefaId}`;
    const id = await AsyncStorage.getItem(chave);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(chave);
    }
  } catch {}
}

export async function cancelarTodosLembretes(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const keys = await AsyncStorage.getAllKeys();
    const notifKeys = keys.filter(
      (k) => k.startsWith("notif_med_") || k.startsWith("notif_tarefa_")
    );
    if (notifKeys.length > 0) await AsyncStorage.multiRemove(notifKeys);
  } catch {}
}

export async function obterERegistrarPushToken(): Promise<void> {
  // push token remoto desativado por design — apenas notificacoes locais
}
