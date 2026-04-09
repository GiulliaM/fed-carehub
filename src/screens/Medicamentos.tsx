import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../config/api";
import { useFocusEffect } from "@react-navigation/native";

import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/pt-br";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(updateLocale);
dayjs.locale("pt-br");
dayjs.updateLocale("pt-br", { weekStart: 1 });

export default function Medicamentos({ navigation }: any) {
  const { cores, tf } = useTema();
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState(dayjs());
  const [weekDays, setWeekDays] = useState<dayjs.Dayjs[]>([]);

  const generateWeekDays = useCallback((baseDate: dayjs.Dayjs) => {
    const startOfWeek = baseDate.startOf("week");
    const days = Array.from({ length: 7 }).map((_, i) =>
      startOfWeek.add(i, "day")
    );
    setWeekDays(days);
  }, []);

  React.useEffect(() => {
    generateWeekDays(dataSelecionada);
  }, [dataSelecionada]);

  const fetchMedicamentos = useCallback(async () => {
    try {
      setCarregando(true);
      let rawPaciente = await AsyncStorage.getItem("paciente");
      let paciente = rawPaciente ? JSON.parse(rawPaciente) : null;

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
        setMedicamentos([]);
        setCarregando(false);
        return;
      }

      const response = await api.get(
        `/medicamentos/${paciente.paciente_id}`
      );
      setMedicamentos(Array.isArray(response) ? response : []);
    } catch {
      Alert.alert("Erro", "Nao foi possivel carregar os medicamentos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMedicamentos();
    }, [fetchMedicamentos])
  );

  const medicamentosDoDia = useMemo(() => {
    return medicamentos.filter((m) => {
      if (!m.inicio) return false;
      const dataInicio = dayjs(m.inicio.split("T")[0]);
      if (m.uso_continuo === 1 || m.uso_continuo === true) {
        return dataSelecionada.isSameOrAfter(dataInicio, "day");
      }
      if (m.duracao_days && m.duracao_days > 0) {
        const dataFim = dataInicio.add(m.duracao_days - 1, "day");
        return (
          dataSelecionada.isSameOrAfter(dataInicio, "day") &&
          dataSelecionada.isSameOrBefore(dataFim, "day")
        );
      }
      return dataSelecionada.isSame(dataInicio, "day");
    });
  }, [medicamentos, dataSelecionada]);

  const toggleConcluido = async (med: any) => {
    const novoConcluido = med.concluido === 1 ? 0 : 1;
    try {
      await api.patch(`/medicamentos/${med.medicamento_id}/toggle`, {
        concluido: novoConcluido,
      });
      fetchMedicamentos();
    } catch {
      Alert.alert("Erro", "Nao foi possivel atualizar o medicamento.");
    }
  };

  const handleNextWeek = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDataSelecionada(dataSelecionada.add(7, "day"));
  };

  const handlePrevWeek = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDataSelecionada(dataSelecionada.subtract(7, "day"));
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
          Medicamentos
        </Text>

        {/* Calendario semanal */}
        <View
          style={[
            styles.calendarContainer,
            { backgroundColor: cores.card, borderColor: cores.border },
          ]}
        >
          <TouchableOpacity onPress={handlePrevWeek}>
            <Ionicons
              name="chevron-back"
              size={22}
              color={cores.primary}
            />
          </TouchableOpacity>

          {weekDays.map((day, index) => {
            const estaSelecionado = day.isSame(dataSelecionada, "day");
            const isToday = day.isSame(dayjs(), "day");
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayItem,
                  estaSelecionado && { backgroundColor: cores.primary },
                  isToday &&
                    !estaSelecionado && {
                      borderWidth: 1,
                      borderColor: cores.primary,
                    },
                ]}
                onPress={() => setDataSelecionada(day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: estaSelecionado ? "#fff" : cores.muted,
                      fontSize: tf(11),
                    },
                  ]}
                >
                  {day.format("dd").toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: estaSelecionado ? "#fff" : cores.text,
                      fontSize: tf(14),
                    },
                  ]}
                >
                  {day.format("D")}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity onPress={handleNextWeek}>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={cores.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Lista */}
        {carregando ? (
          <ActivityIndicator
            size="large"
            color={cores.primary}
            style={{ marginTop: 40 }}
          />
        ) : medicamentosDoDia.length === 0 ? (
          <Text
            style={[
              styles.emptyText,
              { color: cores.muted, fontSize: tf(15) },
            ]}
          >
            Nenhum medicamento para este dia.
          </Text>
        ) : (
          <FlatList
            data={medicamentosDoDia}
            keyExtractor={(item) => item.medicamento_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("DetalhesMedicamento", {
                    medicamento: item,
                  })
                }
                style={[
                  styles.card,
                  {
                    backgroundColor: cores.card,
                    borderColor: cores.border,
                    opacity: item.concluido === 1 ? 0.7 : 1,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => toggleConcluido(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={
                      item.concluido === 1
                        ? "checkbox"
                        : "square-outline"
                    }
                    size={24}
                    color={
                      item.concluido === 1 ? cores.success : cores.muted
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
                          item.concluido === 1 ? "line-through" : "none",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.nome}
                  </Text>
                  <View style={styles.cardMeta}>
                    {item.mg && (
                      <Text
                        style={[
                          styles.metaText,
                          { color: cores.muted, fontSize: tf(12) },
                        ]}
                      >
                        {item.mg}mg
                      </Text>
                    )}
                    {item.qtd_comprimidos && (
                      <Text
                        style={[
                          styles.metaText,
                          { color: cores.muted, fontSize: tf(12) },
                        ]}
                      >
                        {item.qtd_comprimidos} comp.
                      </Text>
                    )}
                    {item.dosagem && !item.mg && (
                      <Text
                        style={[
                          styles.metaText,
                          { color: cores.muted, fontSize: tf(12) },
                        ]}
                      >
                        {item.dosagem}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.cardRight}>
                  {item.horarios && item.horarios.length > 0 && (
                    <View style={styles.timeChip}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={cores.primary}
                      />
                      <Text
                        style={[
                          styles.timeText,
                          { color: cores.primary, fontSize: tf(12) },
                        ]}
                      >
                        {Array.isArray(item.horarios)
                          ? item.horarios.join(", ")
                          : item.horarios}
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
          onPress={() => navigation.navigate("NovaMedicamento")}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16 },
  title: { fontWeight: "700", textAlign: "center", marginBottom: 12 },
  calendarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  dayItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    minWidth: 36,
  },
  dayText: { fontWeight: "600" },
  dayNumber: { fontWeight: "700", marginTop: 2 },
  emptyText: { textAlign: "center", marginTop: 40 },
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
  cardMeta: { flexDirection: "row", gap: 8, marginTop: 2 },
  metaText: { fontWeight: "500" },
  cardRight: { alignItems: "flex-end", marginLeft: 8 },
  timeChip: { flexDirection: "row", alignItems: "center", gap: 3 },
  timeText: { fontWeight: "600" },
  addBtn: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
});
