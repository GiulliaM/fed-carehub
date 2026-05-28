import React, { useState } from "react";
import {
  View,
TextInput,
StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from "react-native";
import { Text } from "../components/Text";
import { AnimatedPressable as TouchableOpacity } from "../components/AnimatedPressable";

import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTema } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../config/api";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { agendarLembreteMedicamento } from "../utils/notificacoes";

const FORMATOS = [
  { label: "Comprimido", value: "Comprimido", unit: "comprimido(s)", verb: "Tomar", concentLabel: "Concentração (mg)" },
  { label: "Gotas", value: "Gotas", unit: "gotas", verb: "Tomar", concentLabel: "Concentração (mg/mL)" },
  { label: "Mililitros (mL)", value: "Mililitros", unit: "mL", verb: "Tomar", concentLabel: "Concentração (mg/mL)" },
  { label: "Injeção", value: "Injecao", unit: "mL", verb: "Aplicar", concentLabel: "Concentração (mg/mL)" },
  { label: "Pomada", value: "Pomada", unit: "", verb: "Aplicar", concentLabel: "" },
];

export default function NovaMedicamento({ navigation }: any) {
  const { cores, tf } = useTema();

  const [nome, setNome] = useState("");
  const [formato, setFormato] = useState("Comprimido");
  const [concentracao, setConcentracao] = useState("");
  const [qtdDose, setQtdDose] = useState("");
  const [localAplicacao, setLocalAplicacao] = useState("");
  const [usoContinuo, setUsoContinuo] = useState(false);
  const [duracaoDays, setDuracaoDays] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [tempHorario, setTempHorario] = useState(new Date(2000, 0, 1, 8, 0));
  const [showHoraPicker, setShowHoraPicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [inicio, setInicio] = useState(new Date());
  const [showInicioPicker, setShowInicioPicker] = useState(false);

  const [salvando, setSalvando] = useState(false);

  const formatoAtual = FORMATOS.find((f) => f.value === formato) || FORMATOS[0];
  const isPomada = formato === "Pomada";

  const dataLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const sentencaDosagem = `${formatoAtual.verb} ${qtdDose || "?"} ${formatoAtual.unit}${concentracao ? ` de ${concentracao}` : ""} por dose`;

  const abrirPickerNovo = () => {
    setTempHorario(new Date(2000, 0, 1, 8, 0));
    setEditingIndex(null);
    setShowHoraPicker(true);
  };

  const abrirPickerEditar = (index: number) => {
    const [hh, mm] = horarios[index].split(":").map(Number);
    setTempHorario(new Date(2000, 0, 1, hh, mm));
    setEditingIndex(index);
    setShowHoraPicker(true);
  };

  const confirmarHorario = (date: Date) => {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const horaStr = `${hh}:${mm}`;
    if (editingIndex !== null) {
      const novos = [...horarios];
      novos[editingIndex] = horaStr;
      setHorarios([...new Set(novos)].sort());
    } else {
      if (!horarios.includes(horaStr)) {
        setHorarios([...horarios, horaStr].sort());
      }
    }
    setEditingIndex(null);
  };

  const removerHorario = (hora: string) => {
    setHorarios(horarios.filter((h) => h !== hora));
  };

  const handleSalvar = async () => {
    if (!nome.trim() || horarios.length === 0) {
      Alert.alert("Aviso", "Preencha o nome e pelo menos um horário!");
      return;
    }

    setSalvando(true);
    try {
      const rawPaciente = await AsyncStorage.getItem("paciente");
      const paciente = rawPaciente ? JSON.parse(rawPaciente) : null;

      if (!paciente?.paciente_id) {
        Alert.alert("Erro", "Nenhum paciente vinculado encontrado.");
        return;
      }

      const res = await api.post("/medicamentos", {
        nome,
        dosagem: formato,
        mg: !isPomada && concentracao ? parseInt(concentracao, 10) : null,
        qtd_comprimidos: !isPomada && qtdDose ? parseInt(qtdDose, 10) : null,
        local_aplicacao: isPomada ? (localAplicacao.trim() || null) : null,
        horarios,
        concluido: 0,
        inicio: dataLocal(inicio),
        duracao_days: !usoContinuo && duracaoDays ? Number(duracaoDays) : null,
        uso_continuo: usoContinuo ? 1 : 0,
        paciente_id: paciente.paciente_id,
      });

      const medId = res.data?.medicamento_id;
      if (medId && dataLocal(inicio) <= dataLocal(new Date())) {
        for (const hor of horarios) {
          agendarLembreteMedicamento(medId, nome.trim(), hor).catch(() => {});
        }
      }

      Alert.alert("Sucesso", "Medicamento cadastrado com sucesso!");
      navigation.goBack();
    } catch (err) {
      console.error("Erro ao salvar medicamento:", err);
      Alert.alert("Erro", "Não foi possível salvar o medicamento.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: cores.primary, fontSize: tf(24) }]}>
          Novo Medicamento
        </Text>

        <View style={[styles.bloco, { backgroundColor: cores.card, borderColor: cores.border }]}>
          <View style={styles.blocoHeader}>
            <Ionicons name="medical-outline" size={20} color={cores.primary} />
            <Text style={[styles.blocoTitulo, { color: cores.text, fontSize: tf(15) }]}>
              Detalhes do Medicamento
            </Text>
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: cores.inputBg, color: cores.inputText, borderColor: cores.border }]}
            placeholder="Nome do medicamento"
            placeholderTextColor={cores.inputPlaceholder}
            value={nome}
            onChangeText={setNome}
          />

          <Text style={[styles.fieldLabel, { color: cores.text, fontSize: tf(14) }]}>Formato</Text>
          <View style={[styles.pickerContainer, { borderColor: cores.border, backgroundColor: cores.inputBg }]}>
            <Picker
              selectedValue={formato}
              onValueChange={(val) => setFormato(val)}
              style={{ color: cores.inputText }}
              dropdownIconColor={cores.muted}
            >
              {FORMATOS.map((f) => (
                <Picker.Item key={f.value} label={f.label} value={f.value} />
              ))}
            </Picker>
          </View>

          {!isPomada && (
            <>
              <Text style={[styles.fieldLabel, { color: cores.text, fontSize: tf(14) }]}>
                {formatoAtual.concentLabel}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: cores.inputBg, color: cores.inputText, borderColor: cores.border }]}
                placeholder="Ex: 500"
                placeholderTextColor={cores.inputPlaceholder}
                keyboardType="numeric"
                value={concentracao}
                onChangeText={setConcentracao}
              />
            </>
          )}
        </View>

        <View style={[styles.bloco, { backgroundColor: cores.card, borderColor: cores.border }]}>
          <View style={styles.blocoHeader}>
            <Ionicons name="timer-outline" size={20} color={cores.primary} />
            <Text style={[styles.blocoTitulo, { color: cores.text, fontSize: tf(15) }]}>
              {isPomada ? "Aplicação" : "Posologia"}
            </Text>
          </View>

          {isPomada ? (
            <TextInput
              style={[styles.input, { backgroundColor: cores.inputBg, color: cores.inputText, borderColor: cores.border }]}
              placeholder="Aplicar onde? Ex: nos pés, nas costas"
              placeholderTextColor={cores.inputPlaceholder}
              value={localAplicacao}
              onChangeText={setLocalAplicacao}
            />
          ) : (
            <>
              <View style={styles.posologiaRow}>
                <Text style={[styles.posologiaTexto, { color: cores.text, fontSize: tf(15) }]}>
                  {formatoAtual.verb}
                </Text>
                <TextInput
                  style={[styles.posologiaInput, { backgroundColor: cores.inputBg, color: cores.inputText, borderColor: cores.border }]}
                  placeholder="0"
                  placeholderTextColor={cores.inputPlaceholder}
                  keyboardType="numeric"
                  value={qtdDose}
                  onChangeText={setQtdDose}
                />
                <Text style={[styles.posologiaTexto, { color: cores.text, fontSize: tf(15) }]}>
                  {formatoAtual.unit} por dose
                </Text>
              </View>

              <View style={[styles.sentencaPreview, { backgroundColor: cores.primary + "15", borderColor: cores.primary + "40" }]}>
                <Ionicons name="information-circle-outline" size={16} color={cores.primary} />
                <Text style={[styles.sentencaTexto, { color: cores.primary, fontSize: tf(13) }]}>
                  {sentencaDosagem}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={[styles.bloco, { backgroundColor: cores.card, borderColor: cores.border }]}>
          <View style={styles.blocoHeader}>
            <Ionicons name="calendar-outline" size={20} color={cores.primary} />
            <Text style={[styles.blocoTitulo, { color: cores.text, fontSize: tf(15) }]}>
              Quando lembrar?
            </Text>
          </View>

          {/* Tipo de tratamento */}
          <View style={[styles.tipoTratamento, { borderColor: cores.border }]}>
            <TouchableOpacity
              style={[
                styles.tipoBtn,
                { borderColor: cores.primary },
                !usoContinuo && { backgroundColor: cores.primary },
              ]}
              onPress={() => setUsoContinuo(false)}
            >
              <Text style={[styles.tipoBtnText, { color: !usoContinuo ? "#fff" : cores.primary }]}>
                Temporário
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tipoBtn,
                { borderColor: cores.primary },
                usoContinuo && { backgroundColor: cores.primary },
              ]}
              onPress={() => { setUsoContinuo(true); setDuracaoDays(""); }}
            >
              <Text style={[styles.tipoBtnText, { color: usoContinuo ? "#fff" : cores.primary }]}>
                Contínuo
              </Text>
            </TouchableOpacity>
          </View>

          {!usoContinuo && (
            <TextInput
              style={[styles.input, { backgroundColor: cores.inputBg, color: cores.inputText, borderColor: cores.border, marginTop: 10 }]}
              placeholder="Duração (em dias)"
              placeholderTextColor={cores.inputPlaceholder}
              keyboardType="numeric"
              value={duracaoDays}
              onChangeText={setDuracaoDays}
            />
          )}

          {/* Horários */}
          <Text style={[styles.fieldLabel, { color: cores.text, fontSize: tf(14), marginTop: 4 }]}>
            Horários {horarios.length > 0 ? `(${horarios.length})` : ""}
          </Text>

          {horarios.length > 0 && (
            <View style={styles.horariosContainer}>
              {horarios.map((h, i) => (
                <View key={i} style={[styles.horarioItem, { backgroundColor: cores.primary + "20" }]}>
                  <TouchableOpacity style={styles.horarioEditArea} onPress={() => abrirPickerEditar(i)}>
                    <Ionicons name="time-outline" size={16} color={cores.primary} />
                    <Text style={[styles.horarioText, { color: cores.primary }]}>{h}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.horarioRemoveBtn} onPress={() => removerHorario(h)}>
                    <Ionicons name="close-circle" size={20} color={cores.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.addHorarioBtn, { borderColor: cores.primary }]}
            onPress={abrirPickerNovo}
          >
            <Ionicons name="add-circle-outline" size={22} color={cores.primary} />
            <Text style={[styles.addHorarioBtnText, { color: cores.primary }]}>
              Adicionar horário
            </Text>
          </TouchableOpacity>

          {showHoraPicker && (
            <DateTimePicker
              value={tempHorario}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={(e, date) => {
                setShowHoraPicker(false);
                if (date) confirmarHorario(date);
              }}
            />
          )}

          {/* Data de início */}
          <TouchableOpacity
            style={[styles.btnSelect, { backgroundColor: cores.inputBg, borderColor: cores.border }]}
            onPress={() => setShowInicioPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={cores.text} />
            <Text style={[styles.btnSelectText, { color: cores.text, fontSize: tf(15) }]}>
              Início: {dayjs(inicio).format("DD/MM/YYYY")}
            </Text>
          </TouchableOpacity>

          {showInicioPicker && (
            <DateTimePicker
              value={inicio}
              mode="date"
              onChange={(e, date) => {
                setShowInicioPicker(false);
                if (date) setInicio(date);
              }}
            />
          )}
        </View>

        {/* Botões */}
        <TouchableOpacity
          disabled={salvando}
          style={[styles.button, { backgroundColor: salvando ? cores.muted : cores.primary }]}
          onPress={handleSalvar}
        >
          {salvando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Salvar Medicamento</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: cores.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.cancelButtonText, { color: cores.muted }]}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16, paddingBottom: 32 },
  title: { fontWeight: "700", textAlign: "center", marginBottom: 18 },
  bloco: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
  },
  blocoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  blocoTitulo: { fontWeight: "700" },
  fieldLabel: { fontWeight: "600", marginBottom: 6 },
  input: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  posologiaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  posologiaTexto: { fontWeight: "600" },
  posologiaInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 16,
    fontWeight: "700",
    width: 70,
    textAlign: "center",
  },
  sentencaPreview: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    gap: 6,
  },
  sentencaTexto: { flex: 1, fontStyle: "italic", fontWeight: "600" },
  tipoTratamento: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    gap: 0,
  },
  tipoBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 0,
  },
  tipoBtnText: { fontWeight: "700", fontSize: 14 },
  horariosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 8,
  },
  horarioItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 6,
  },
  horarioEditArea: { flexDirection: "row", alignItems: "center", gap: 4 },
  horarioText: { fontWeight: "700", fontSize: 15, marginRight: 4 },
  horarioRemoveBtn: { padding: 2 },
  addHorarioBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  addHorarioBtnText: { fontSize: 15, fontWeight: "600" },
  btnSelect: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnSelectText: { fontWeight: "600" },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
  },
  cancelButtonText: { fontWeight: "600", fontSize: 16 },
});
