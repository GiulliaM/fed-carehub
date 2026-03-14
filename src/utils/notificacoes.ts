/**
 * Serviço de notificações locais para lembretes de tarefas.
 * Som: use o arquivo em assets/sounds/notificacao.mp3 (veja README na pasta).
 */
// Serviço pra mandar notificação no celular avisando das tarefas, tipo "ei, não esquece!"
import AsyncStorage from "@react-native-async-storage/async-storage";

const CANAL_ID = "carehub-lembretes";
const PREF_ATIVO = "notificacoes_lembrete_ativo";

// Nome do som customizado (arquivo em assets/sounds/notificacao.mp3 ou .wav)
// No Android o canal usa este nome quando o arquivo está em res/raw/notificacao
export const NOME_SOM_NOTIFICACAO = "notificacao";

export async function notificacoesLembreteAtivas(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(PREF_ATIVO);
    return v === "true";
  } catch {
    return true;
  }
}

export async function setNotificacoesLembreteAtivas(ativo: boolean): Promise<void> {
  await AsyncStorage.setItem(PREF_ATIVO, ativo ? "true" : "false");
}

/**
 * Pede permissão e configura o canal (Android) com som.
 */
export async function configurarCanal(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== "granted") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CANAL_ID, {
      name: "Lembretes de tarefas",
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: true,
    });
  }
  return true;
}

/**
 * Agenda um lembrete para a data/hora da tarefa.
 * identifier: use "tarefa_" + tarefa_id para poder cancelar depois.
 */
export async function agendarLembreteTarefa(
  tarefaId: number,
  titulo: string,
  data: string,
  hora: string | null
): Promise<string | null> {
  const ativo = await notificacoesLembreteAtivas();
  if (!ativo) return null;

  if (!data || !hora) return null;
  const [y, m, d] = data.split("-").map(Number);
  const [hh, mm] = (hora || "09:00").split(":").map(Number);
  const date = new Date(y, m - 1, d, hh, mm, 0);
  if (date.getTime() <= Date.now()) return null;

  const ok = await configurarCanal();
  if (!ok) return null;

  const identifier = "tarefa_" + tarefaId;
  await Notifications.cancelScheduledNotificationAsync(identifier);

  const content: Notifications.NotificationContentInput = {
    title: "Lembrete: Tarefa",
    body: titulo || "Tarefa agendada",
    sound: true,
    data: { tarefaId, tipo: "tarefa" },
  };

  const trigger = {
    date,
    channelId: CANAL_ID,
  };

  const id = await Notifications.scheduleNotificationAsync({
    identifier,
    content,
    trigger,
  });
  return id;
}

/**
 * Cancela o lembrete agendado de uma tarefa (ex.: ao excluir ou marcar concluída).
 */
export async function cancelarLembreteTarefa(tarefaId: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync("tarefa_" + tarefaId);
}

/**
 * Cancela todos os lembretes de tarefas (útil ao desativar notificações).
 */
export async function cancelarTodosLembretes(): Promise<void> {
  const pendentes = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of pendentes) {
    if (n.identifier?.startsWith("tarefa_")) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}
