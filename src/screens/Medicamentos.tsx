import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  View,
FlatList,
ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl
} from "react-native";
import { Text } from "../components/Text";
import { AnimatedPressable as TouchableOpacity } from "../components/AnimatedPressable";

import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import api from "../config/api";
import { agendarLembreteMedicamento } from "../utils/notificacoes";

import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import "dayjs/locale/pt-br";

dayjs.extend(isSameOrBefore);
dayjs.locale("pt-br");

LocaleConfig.locales["pt-br"] = {
  monthNames: ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],
  monthNamesShort: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
  dayNames: ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"],
  dayNamesShort: ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],
  today: "Hoje",
};
LocaleConfig.defaultLocale = "pt-br";

type SlotDose = {
  key: string;
  medicamento_id: number;
  medicamento: any;
  nome: string;
  horario: string;
  doseInfo: string;
  tomado: boolean;
};

function normalizarData(valor: any): string {
  if (!valor) return "";
  return String(valor).substring(0, 10);
}

const UNIDADE: Record<string, string> = {
  Comprimido: "comprimido(s)",
  Gotas: "gotas",
  Mililitros: "mL",
  Injecao: "mL",
  Pomada: "",
};

const ICONE_FORMATO: Record<string, { tipo: "ion" | "mci"; nome: string }> = {
  Comprimido: { tipo: "mci", nome: "pill" },
  Gotas:      { tipo: "ion", nome: "water-outline" },
  Mililitros: { tipo: "mci", nome: "bottle-tonic-outline" },
  Injecao:    { tipo: "mci", nome: "needle" },
  Pomada:     { tipo: "mci", nome: "lotion-outline" },
};

function FormatoIcone({ dosagem, color }: { dosagem: string; color: string }) {
  const cfg = ICONE_FORMATO[dosagem];
  if (!cfg) return <Ionicons name="medical-outline" size={20} color={color} />;
  if (cfg.tipo === "mci") return <MaterialCommunityIcons name={cfg.nome as any} size={20} color={color} />;
  return <Ionicons name={cfg.nome as any} size={20} color={color} />;
}

function montarDoseInfo(med: any): string {
  const formato = (med.dosagem ?? "").trim();
  const unidade = UNIDADE[formato] ?? "unidade(s)";
  const qtd = med.qtd_comprimidos;
  const mgInt = med.mg ? Math.round(Number(med.mg)) : null;
  const conc = mgInt ? ` · ${mgInt}mg` : "";
  if (formato === "Pomada") {
    return med.local_aplicacao ? `Aplicar em: ${med.local_aplicacao}` : "Pomada";
  }
  if (qtd) return `${qtd} ${unidade}${conc}`;
  if (med.mg) return `${med.mg}mg`;
  return "";
}

function medicamentoAtivoNaData(med: any, dataStr: string): boolean {
  const inicioStr = normalizarData(med.inicio);
  if (!inicioStr) return false;
  if (dataStr < inicioStr) return false;
  if (med.uso_continuo === 1 || med.uso_continuo === true) return true;
  if (med.data_fim) return dataStr <= normalizarData(med.data_fim);
  if (med.duracao_days && med.duracao_days > 0) {
    const fim = dayjs(inicioStr)
      .add(Number(med.duracao_days) - 1, "day")
      .format("YYYY-MM-DD");
    return dataStr <= fim;
  }
  return dataStr === inicioStr;
}

export default function Medicamentos({ navigation }: any) {
  const { cores, tf, nomeTema } = useTema();
  const route = useRoute<any>();

  const hoje = dayjs().format("YYYY-MM-DD");
  const [dataSelecionada, setDataSelecionada] = useState(hoje);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [doses, setDoses] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pacienteId, setPacienteId] = useState<number | null>(null);

  // Ao clicar na aba de medicamentos já estando nela → volta para hoje
  useEffect(() => {
    if (route.params?.resetToToday) {
      setDataSelecionada(dayjs().format("YYYY-MM-DD"));
    }
  }, [route.params?.resetToToday]);


  const fetchTudo = useCallback(async () => {
    setCarregando(true);
    try {
      let raw = await AsyncStorage.getItem("paciente");
      let paciente = raw ? JSON.parse(raw) : null;

      if (!paciente?.paciente_id) {
        const r = await api.get("/pacientes");
        if (Array.isArray(r.data) && r.data.length > 0) {
          paciente = r.data[0];
          await AsyncStorage.setItem("paciente", JSON.stringify(paciente));
        }
      }

      if (!paciente?.paciente_id) {
        setMedicamentos([]);
        setDoses([]);
        setCarregando(false);
        return;
      }

      setPacienteId(paciente.paciente_id);

      const [medRes, dosesRes] = await Promise.all([
        api.get(`/medicamentos/${paciente.paciente_id}`),
        api.get(`/medicamentos/${paciente.paciente_id}/doses/${dataSelecionada}`),
      ]);

      const listaMeds = Array.isArray(medRes.data) ? medRes.data : [];
      const listaDoses = Array.isArray(dosesRes.data) ? dosesRes.data : [];
      setMedicamentos(listaMeds);
      setDoses(listaDoses);

      // Agendar notificações de medicamentos para hoje
      if (dataSelecionada === hoje) {
        const tomadosMap: Record<string, boolean> = {};
        listaDoses.forEach((d: any) => {
          const hor = String(d.horario ?? "").substring(0, 5);
          tomadosMap[`${d.medicamento_id}-${hor}`] = !!d.tomado;
        });
        for (const med of listaMeds) {
          if (!medicamentoAtivoNaData(med, dataSelecionada)) continue;
          const horarios = Array.isArray(med.horarios) ? med.horarios : [];
          for (const horario of horarios) {
            const hor = String(horario).substring(0, 5);
            if (!tomadosMap[`${med.medicamento_id}-${hor}`]) {
              agendarLembreteMedicamento(med.medicamento_id, (med.nome ?? "").trim(), hor).catch(() => {});
            }
          }
        }
      }
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os medicamentos.");
    } finally {
      setCarregando(false);
    }
  }, [dataSelecionada]);

  const fetchDoses = useCallback(async (data: string, pid: number) => {
    try {
      const r = await api.get(`/medicamentos/${pid}/doses/${data}`);
      setDoses(Array.isArray(r.data) ? r.data : []);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { fetchTudo(); }, [fetchTudo]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTudo();
    setRefreshing(false);
  }, [fetchTudo]);

  const handleDiaPress = useCallback(
    (d: { dateString: string }) => {
      setDataSelecionada(d.dateString);
      if (pacienteId !== null) fetchDoses(d.dateString, pacienteId);
    },
    [pacienteId, fetchDoses]
  );


  const agoraHora = dayjs().format("HH:mm");

  const slots: SlotDose[] = useMemo(() => {
    const dosesMap: Record<string, boolean> = {};
    doses.forEach((d) => {
      const hor = String(d.horario ?? "").substring(0, 5);
      dosesMap[`${d.medicamento_id}-${hor}`] = !!d.tomado;
    });

    const lista: SlotDose[] = [];

    medicamentos.forEach((med) => {
      if (!medicamentoAtivoNaData(med, dataSelecionada)) return;
      const horarios = Array.isArray(med.horarios) ? med.horarios : [];

      horarios.forEach((horario: string) => {
        const hor = String(horario).substring(0, 5);
        lista.push({
          key: `${med.medicamento_id}-${hor}`,
          medicamento_id: med.medicamento_id,
          medicamento: med,
          nome: (med.nome ?? "").trim(),
          horario: hor,
          doseInfo: montarDoseInfo(med),
          tomado: dosesMap[`${med.medicamento_id}-${hor}`] ?? false,
        });
      });
    });

    return lista.sort((a, b) => a.horario.localeCompare(b.horario));
  }, [medicamentos, doses, dataSelecionada]);


  const handleToggle = useCallback(
    async (slot: SlotDose) => {
      const novoTomado = !slot.tomado;
      const hor = slot.horario;

      setDoses((prev) => {
        const existe = prev.find(
          (d) => d.medicamento_id === slot.medicamento_id && String(d.horario).substring(0, 5) === hor
        );
        if (existe) {
          return prev.map((d) =>
            d.medicamento_id === slot.medicamento_id && String(d.horario).substring(0, 5) === hor
              ? { ...d, tomado: novoTomado ? 1 : 0 }
              : d
          );
        }
        return [...prev, { medicamento_id: slot.medicamento_id, horario: hor, tomado: novoTomado ? 1 : 0 }];
      });

      try {
        await api.patch(`/medicamentos/${slot.medicamento_id}/dose`, {
          data: dataSelecionada,
          horario: hor,
          tomado: novoTomado ? 1 : 0,
        });
      } catch {
        setDoses((prev) =>
          prev.map((d) =>
            d.medicamento_id === slot.medicamento_id && String(d.horario).substring(0, 5) === hor
              ? { ...d, tomado: slot.tomado ? 1 : 0 }
              : d
          )
        );
        Alert.alert("Erro", "Não foi possível atualizar a dose.");
      }
    },
    [dataSelecionada]
  );


  const marcarDias = useMemo(() => {
    const marked: Record<string, any> = {};
    const janela = dayjs().subtract(1, "month");
    const janelafim = dayjs().add(2, "month");

    medicamentos.forEach((med) => {
      const inicioStr = normalizarData(med.inicio);
      if (!inicioStr) return;
      const medInicio = dayjs(inicioStr);

      let medFim: dayjs.Dayjs;
      if (med.uso_continuo === 1 || med.uso_continuo === true) {
        medFim = janelafim;
      } else if (med.data_fim) {
        medFim = dayjs(normalizarData(med.data_fim));
      } else if (med.duracao_days && med.duracao_days > 0) {
        medFim = medInicio.add(Number(med.duracao_days) - 1, "day");
      } else {
        medFim = medInicio;
      }

      let cur = medInicio.isBefore(janela) ? janela : medInicio;
      const end = medFim.isAfter(janelafim) ? janelafim : medFim;

      while (cur.isSameOrBefore(end, "day")) {
        const ds = cur.format("YYYY-MM-DD");
        marked[ds] = { marked: true, dotColor: cores.primary };
        cur = cur.add(1, "day");
      }
    });

    // Bolinha sempre no dia atual
    marked[hoje] = {
      ...(marked[hoje] ?? {}),
      marked: true,
      dotColor: cores.accent ?? cores.primary,
    };

    marked[dataSelecionada] = {
      ...(marked[dataSelecionada] ?? {}),
      selected: true,
      selectedColor: cores.primary,
    };

    return marked;
  }, [medicamentos, dataSelecionada, cores.primary, cores.accent, hoje]);


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: cores.primary, fontSize: tf(24) }]}>
          Medicamentos
        </Text>

        <Calendar
          key={nomeTema}
          markedDates={marcarDias}
          onDayPress={handleDiaPress}
          renderArrow={(dir) => (
            <Ionicons
              name={dir === "left" ? "chevron-back" : "chevron-forward"}
              size={20}
              color={cores.primary}
            />
          )}
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
          <ActivityIndicator size="large" color={cores.primary} style={{ marginTop: 20 }} />
        ) : slots.length === 0 ? (
          <Text style={[styles.emptyText, { color: cores.muted, fontSize: tf(15) }]}>
            Nenhum medicamento para este dia.
          </Text>
        ) : (
          <FlatList
            data={slots}
            keyExtractor={(item) => item.key}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[cores.primary]} tintColor={cores.primary} />
            }
            renderItem={({ item }) => {
              const atrasado = dataSelecionada === hoje && !item.tomado && item.horario < agoraHora;
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate("DetalhesMedicamento", { medicamento: item.medicamento })
                  }
                  style={[
                    styles.card,
                    {
                      backgroundColor: cores.card,
                      borderColor: atrasado ? cores.danger : cores.border,
                      opacity: item.tomado ? 0.7 : 1,
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleToggle(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={item.tomado ? "checkbox" : "square-outline"}
                      size={24}
                      color={item.tomado ? cores.success : cores.muted}
                    />
                  </TouchableOpacity>

                  <View style={styles.formatoIcone}>
                    <FormatoIcone
                      dosagem={item.medicamento?.dosagem ?? ""}
                      color={item.tomado ? cores.muted : cores.primary}
                    />
                  </View>

                  <View style={styles.cardContent}>
                    <Text
                      style={[
                        styles.cardTitle,
                        {
                          color: cores.text,
                          fontSize: tf(16),
                          textDecorationLine: item.tomado ? "line-through" : "none",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.nome}
                    </Text>
                    {item.doseInfo ? (
                      <Text
                        style={[styles.cardSubtitle, { color: cores.muted, fontSize: tf(13) }]}
                        numberOfLines={1}
                      >
                        {item.doseInfo}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.cardRight}>
                    <View style={styles.timeChip}>
                      <Ionicons
                        name={atrasado ? "alert-circle" : "time-outline"}
                        size={14}
                        color={atrasado ? cores.danger : cores.primary}
                      />
                      <Text
                        style={[
                          styles.timeText,
                          { color: atrasado ? cores.danger : cores.primary, fontSize: tf(13) },
                        ]}
                      >
                        {item.horario}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: cores.primary }]}
        onPress={() => navigation.navigate("NovaMedicamento")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
  formatoIcone: { marginHorizontal: 8 },
  cardContent: { flex: 1, marginLeft: 4 },
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
