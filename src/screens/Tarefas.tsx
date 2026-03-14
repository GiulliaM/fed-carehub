import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { useTema } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import api from "../utils/clienteApi";
import { cancelarLembreteTarefa } from "../utils/notificacoes";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

export default function Tarefas({ navigation }: any) {
  const { cores, tf } = useTema();
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const hoje = dayjs().format("YYYY-MM-DD");
  const [dataSelecionada, setDataSelecionada] = useState(hoje);

  const normalizar = (data: string) =>
    dayjs(data).startOf("day").format("YYYY-MM-DD");

  const fetchTarefas = useCallback(async () => {
    setCarregando(true);
    try {
      let raw = await AsyncStorage.getItem("paciente");
      let paciente = raw ? JSON.parse(raw) : null;

      if (!paciente?.paciente_id) {
        try {
          const pacienteRes = await api.get("/pacientes");
          if (Array.isArray(pacienteRes) && pacienteRes.length > 0) {
            paciente = pacienteRes[0];
            await AsyncStorage.setItem("paciente", JSON.stringify(paciente));
          }
        } catch {}
      }

      if (!paciente?.paciente_id) {
        setTarefas([]);
        setCarregando(false);
        return;
      }

      const data = await api.get(
        `/tarefas?paciente_id=${paciente.paciente_id}`
      );
      if (!Array.isArray(data)) {
        setTarefas([]);
        setCarregando(false);
        return;
      }

      const tarefasCorrigidas = data.map((t: any) => ({
        ...t,
        data: normalizar(t.data),
        concluida: t.concluida === 1 ? 1 : 0,
      }));

      setTarefas(tarefasCorrigidas);
    } catch {
      setTarefas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTarefas();
    }, [fetchTarefas])
  );

  const tarefasDoDia = useMemo(
    () =>
      tarefas
        .filter((t) => t.data === dataSelecionada)
        .sort((a, b) => {
          if (!a.hora && !b.hora) return 0;
          if (!a.hora) return 1;
          if (!b.hora) return -1;
          return a.hora.localeCompare(b.hora);
        }),
    [tarefas, dataSelecionada]
  );

  const marcarDias = useMemo(() => {
    const marked: Record<string, any> = {};
    tarefas.forEach((t) => {
      const d = normalizar(t.data);
      marked[d] = { marked: true, dotColor: cores.primary };
    });
    marked[dataSelecionada] = {
      ...(marked[dataSelecionada] || {}),
      selected: true,
      selectedColor: cores.primary,
    };
    return marked;
  }, [tarefas, dataSelecionada, cores.primary]);

  const toggleConcluida = async (tarefa: any) => {
    const novoConcluida = tarefa.concluida === 1 ? 0 : 1;
    try {
      await api.patch(`/tarefas/${tarefa.tarefa_id}/toggle`, {
        concluida: novoConcluida,
      });
      if (novoConcluida) await cancelarLembreteTarefa(tarefa.tarefa_id);
      fetchTarefas();
    } catch {
      Alert.alert("Erro", "Nao foi possivel atualizar a tarefa.");
    }
  };

  const excluirTarefa = (id: number) => {
    Alert.alert("Excluir", "Deseja realmente excluir esta tarefa?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/tarefas/${id}`);
            await cancelarLembreteTarefa(id);
            fetchTarefas();
          } catch {
            Alert.alert("Erro", "Nao foi possivel excluir.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: cores.background }]}
    >
      <View style={styles.container}>
        <Text
          style={[
            styles.title,
            { color: cores.primary, fontSize: tf(24) },
          ]}
        >
          Tarefas
        </Text>

        <Calendar
          markedDates={marcarDias}
          onDayPress={(d) => setDataSelecionada(d.dateString)}
          theme={{
            backgroundColor: cores.card,
            calendarBackground: cores.card,
            textSectionTitleColor: cores.muted,
            selectedDayBackgroundColor: cores.primary,
            selectedDayTextColor: "#fff",
            todayTextColor: cores.primary,
            dayTextColor: cores.text,
            textDisabledColor: cores.border,
            monthTextColor: cores.text,
            arrowColor: cores.primary,
          }}
          style={{
            borderRadius: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: cores.border,
          }}
        />

        {carregando ? (
          <ActivityIndicator size="large" color={cores.primary} />
        ) : tarefasDoDia.length === 0 ? (
          <Text
            style={[
              styles.emptyText,
              { color: cores.muted, fontSize: tf(15) },
            ]}
          >
            Nenhuma tarefa neste dia.
          </Text>
        ) : (
          <FlatList
            data={tarefasDoDia}
            keyExtractor={(i) => i.tarefa_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("EditTarefa", {
                    tarefa: item,
                    modoVisualizacao: true,
                  })
                }
                style={[
                  styles.card,
                  {
                    backgroundColor: cores.card,
                    borderColor: cores.border,
                    opacity: item.concluida === 1 ? 0.7 : 1,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => toggleConcluida(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={
                      item.concluida === 1
                        ? "checkbox"
                        : "square-outline"
                    }
                    size={24}
                    color={
                      item.concluida === 1 ? cores.success : cores.muted
                    }
                  />
                </TouchableOpacity>

                <View style={styles.cardContent}>
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color: cores.text,
                        fontSize: tf(16),
                        textDecorationLine:
                          item.concluida === 1 ? "line-through" : "none",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.titulo}
                  </Text>
                  {item.detalhes ? (
                    <Text
                      style={[
                        styles.cardSubtitle,
                        { color: cores.muted, fontSize: tf(13) },
                      ]}
                      numberOfLines={1}
                    >
                      {item.detalhes}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.cardRight}>
                  {item.hora && (
                    <View style={styles.timeChip}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={cores.primary}
                      />
                      <Text
                        style={[
                          styles.timeText,
                          { color: cores.primary, fontSize: tf(13) },
                        ]}
                      >
                        {item.hora?.slice(0, 5)}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: cores.primary }]}
          onPress={() => navigation.navigate("NovaTarefa")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16 },
  title: { fontWeight: "700", textAlign: "center", marginBottom: 12 },
  emptyText: { textAlign: "center", marginTop: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    elevation: 1,
  },
  cardContent: { flex: 1, marginLeft: 12 },
  cardTitle: { fontWeight: "600" },
  cardSubtitle: { marginTop: 2 },
  cardRight: { alignItems: "flex-end", marginLeft: 8 },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: { fontWeight: "600" },
  addBtn: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
});
