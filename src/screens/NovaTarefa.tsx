// NovaTarefa.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utils/clienteApi";
import { useTema } from "../context/ThemeContext";
import { agendarLembreteTarefa, cancelarLembreteTarefa } from "../utils/notificacoes";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

const WEEKDAYS = [
  { label: "Dom", idx: 0 },
  { label: "Seg", idx: 1 },
  { label: "Ter", idx: 2 },
  { label: "Qua", idx: 3 },
  { label: "Qui", idx: 4 },
  { label: "Sex", idx: 5 },
  { label: "Sáb", idx: 6 },
];

export default function NovaTarefa({ navigation, route }: any) {
  const { cores } = useTema();
  const editingTarefa = route?.params?.tarefa ?? null;

  // Use dayjs to avoid timezone shifts
  const [titulo, setTitulo] = useState(editingTarefa?.titulo ?? "");
  const [detalhes, setDetalhes] = useState(editingTarefa?.detalhes ?? "");
  const [data, setData] = useState<Date>(
    editingTarefa?.data ? dayjs(editingTarefa.data).startOf("day").toDate() : dayjs().startOf("day").toDate()
  );
  const [hora, setHora] = useState<Date>(
    editingTarefa?.hora
      ? dayjs(`1970-01-01 ${editingTarefa.hora}`).toDate()
      : new Date(2000, 0, 1, 8, 0)
  );
  const [horaDefinida, setHoraDefinida] = useState(!!editingTarefa?.hora);
  const [showDataPicker, setShowDataPicker] = useState(false);
  const [showHoraPicker, setShowHoraPicker] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const initialDias =
    editingTarefa?.dias_repeticao && typeof editingTarefa.dias_repeticao === "string"
      ? editingTarefa.dias_repeticao.split(",").map((s: string) => s.trim()).filter(Boolean).map(Number)
      : [];

  const [diasRepeticaoArr, setDiasRepeticaoArr] = useState<number[]>(initialDias);
  const [preset, setPreset] = useState<string>(() => {
    if (!initialDias || initialDias.length === 0) return "";
    if (initialDias.length === 7) return "todos";
    const segQuaSex = [1,3,5].every(i => initialDias.includes(i)) && initialDias.length === 3;
    const terQui = [2,4].every(i => initialDias.includes(i)) && initialDias.length === 2;
    if (segQuaSex) return "segqua";
    if (terQui) return "terqui";
    return "custom";
  });

  useEffect(() => {
    if (diasRepeticaoArr.length === 0) setPreset("");
    else if (diasRepeticaoArr.length === 7) setPreset("todos");
    else {
      const segQuaSex = [1,3,5].every(i => diasRepeticaoArr.includes(i)) && diasRepeticaoArr.length === 3;
      const terQui = [2,4].every(i => diasRepeticaoArr.includes(i)) && diasRepeticaoArr.length === 2;
      if (segQuaSex) setPreset("segqua");
      else if (terQui) setPreset("terqui");
      else setPreset("custom");
    }
  }, [diasRepeticaoArr.length]);

  const toggleWeekday = (idx: number) => {
    setDiasRepeticaoArr(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      return [...prev, idx].sort((a,b) => a-b);
    });
  };

  const applyPreset = (value: string) => {
    setPreset(value);
    if (value === "") setDiasRepeticaoArr([]);
    else if (value === "todos") setDiasRepeticaoArr(WEEKDAYS.map(d => d.idx));
    else if (value === "segqua") setDiasRepeticaoArr([1,3,5]);
    else if (value === "terqui") setDiasRepeticaoArr([2,4]);
  };

  const formatTimeForDB = (d: Date) => {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const handleSalvar = async () => {
    if (!titulo.trim()) {
      Alert.alert("Atenção", "Dê um título para a tarefa.");
      return;
    }
    setSalvando(true);
    try {
      const rawPaciente = await AsyncStorage.getItem("paciente");
      const paciente = rawPaciente ? JSON.parse(rawPaciente) : null;
      if (!paciente?.paciente_id) {
        Alert.alert("Erro", "Nenhum paciente vinculado encontrado.");
        setSalvando(false);
        return;
      }

      // EDIÇÃO
      if (editingTarefa && editingTarefa.tarefa_id) {
        const payload: any = {
          titulo: titulo.trim(),
          detalhes: detalhes.trim(),
          data: dayjs(data).format("YYYY-MM-DD"),
          hora: formatTimeForDB(hora),
          concluida: editingTarefa.concluida ? 1 : 0,
          dias_repeticao: "",
          paciente_id: paciente.paciente_id,
        };
        await api.patch(`/tarefas/${editingTarefa.tarefa_id}`, payload);
        await cancelarLembreteTarefa(editingTarefa.tarefa_id);
        if (!payload.concluida) {
          await agendarLembreteTarefa(
            editingTarefa.tarefa_id,
            payload.titulo,
            payload.data,
            payload.hora
          );
        }
        Alert.alert("Sucesso", "Tarefa atualizada com sucesso!");
        navigation.goBack();
        return;
      }

      // CRIAÇÃO - sem repetição
      if (diasRepeticaoArr.length === 0) {
        const payload: any = {
          titulo: titulo.trim(),
          detalhes: detalhes.trim(),
          data: dayjs(data).format("YYYY-MM-DD"),
          hora: formatTimeForDB(hora),
          concluida: 0,
          dias_repeticao: "",
          paciente_id: paciente.paciente_id,
        };
        const res = await api.post("/tarefas", payload);
        const tarefaId = res?.tarefa_id;
        if (tarefaId) {
          await agendarLembreteTarefa(
            tarefaId,
            payload.titulo,
            payload.data,
            payload.hora
          );
        }
        Alert.alert("Sucesso", "Tarefa cadastrada com sucesso!");
        navigation.goBack();
        return;
      }

      // CRIAÇÃO - com repetição (gera tarefas individuais)
      const tarefasCriadas: string[] = [];
      const dataInicio = dayjs(data);
      const quantidadeSemanas = 4;
      for (let semana = 0; semana < quantidadeSemanas; semana++) {
        for (const diaIdx of diasRepeticaoArr) {
          const diasAteProximoDia = (diaIdx - dataInicio.day() + 7) % 7;
          const proximaData = dataInicio.add(semana * 7, "day").add(diasAteProximoDia, "day");
          const payload: any = {
            titulo: titulo.trim(),
            detalhes: detalhes.trim(),
            data: proximaData.format("YYYY-MM-DD"),
            hora: formatTimeForDB(hora),
            concluida: 0,
            dias_repeticao: "",
            paciente_id: paciente.paciente_id,
          };
          await api.post("/tarefas", payload);
          tarefasCriadas.push(proximaData.format("DD/MM"));
        }
      }
      Alert.alert("Sucesso!", `${tarefasCriadas.length} tarefas criadas para os próximos 3 meses.\nPrimeiras: ${tarefasCriadas.slice(0,5).join(", ")}...`);
      navigation.goBack();
    } catch (err: any) {
      console.error("Erro ao salvar tarefa:", err?.response || err);
      Alert.alert("Erro", "Não foi possível salvar a tarefa. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: cores.primary }]}>
          {editingTarefa ? "Editar Tarefa" : "Nova Tarefa"}
        </Text>

        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={[styles.input]}
          placeholder="Ex: Trocar curativo"
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text style={styles.label}>Detalhes</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Detalhes da tarefa..."
          value={detalhes}
          multiline
          onChangeText={setDetalhes}
        />

        <TouchableOpacity style={styles.selectButton} onPress={() => setShowDataPicker(true)}>
          <Text style={styles.selectButtonText}>Data: {dayjs(data).format("DD/MM/YYYY")}</Text>
        </TouchableOpacity>
        {showDataPicker && (
          <DateTimePicker
            value={data}
            mode="date"
            display="default"
            onChange={(e, dateSel) => {
              setShowDataPicker(false);
              if (dateSel) setData(dateSel);
            }}
          />
        )}

        <TouchableOpacity style={styles.selectButton} onPress={() => setShowHoraPicker(true)}>
          <Text style={styles.selectButtonText}>
            {horaDefinida ? `Hora: ${dayjs(hora).format("HH:mm")}` : "Definir horário"}
          </Text>
        </TouchableOpacity>
        {showHoraPicker && (
          <DateTimePicker
            value={hora}
            mode="time"
            is24Hour
            display="spinner"
            onChange={(e, dateSel) => {
              setShowHoraPicker(false);
              if (dateSel) {
                setHora(dateSel);
                setHoraDefinida(true);
              }
            }}
          />
        )}

        <Text style={styles.label}>Repetição</Text>
        <View style={styles.repeticaoContainer}>
          {[
            { label: "Nenhuma", value: "" },
            { label: "Todos os dias", value: "todos" },
            { label: "Seg/Qua/Sex", value: "segqua" },
            { label: "Ter/Qui", value: "terqui" },
            { label: "Personalizar", value: "custom" },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.repeticaoBtn,
                preset === item.value && { backgroundColor: cores.primary },
              ]}
              onPress={() => applyPreset(item.value)}
            >
              <Text style={[styles.repeticaoBtnText, preset === item.value && { color: "#fff" }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((d) => {
            const active = diasRepeticaoArr.includes(d.idx);
            return (
              <TouchableOpacity
                key={d.idx}
                style={[styles.weekdayBtn, { borderColor: cores.primary }, active && { backgroundColor: cores.primary }]}
                onPress={() => toggleWeekday(d.idx)}
              >
                <Text style={[styles.weekdayText, active && { color: "#fff" }]}>{d.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={[styles.btnSalvar, { backgroundColor: cores.primary }]} disabled={salvando} onPress={handleSalvar}>
          {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{editingTarefa ? "Salvar alterações" : "Salvar Tarefa"}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btnCancelar, { borderColor: cores.primary }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.btnCancelarText, { color: cores.primary }]}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 12,
  },
  selectButton: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  selectButtonText: {
    fontWeight: "600",
    color: "#333",
  },
  repeticaoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  repeticaoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
    marginBottom: 8,
  },
  repeticaoBtnText: {
    fontWeight: "600",
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  weekdayBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  weekdayText: {
    fontWeight: "700",
  },
  btnSalvar: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  btnCancelar: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 2,
  },
  btnCancelarText: {
    fontWeight: "700",
    fontSize: 16,
  },
});
