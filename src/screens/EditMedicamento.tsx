import React, { useState } from "react";
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
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import api from "../config/api";
import { useTema } from "../context/ThemeContext";

const FORMATOS = [
  { label: "Comprimido", value: "Comprimido", unit: "comprimido(s)", verb: "Tomar", concentLabel: "Concentração (mg)" },
  { label: "Gotas", value: "Gotas", unit: "gotas", verb: "Tomar", concentLabel: "Concentração (mg/mL)" },
  { label: "Mililitros (mL)", value: "Mililitros", unit: "mL", verb: "Tomar", concentLabel: "Concentração (mg/mL)" },
  { label: "Injeção", value: "Injecao", unit: "mL", verb: "Aplicar", concentLabel: "Concentração (mg/mL)" },
  { label: "Pomada", value: "Pomada", unit: "g", verb: "Aplicar", concentLabel: "Concentração (%)" },
];

// Resolve o formato salvo no campo `dosagem` — se não for um dos conhecidos, usa Comprimido
function resolverFormato(dosagem: string | null | undefined): string {
  const match = FORMATOS.find((f) => f.value === dosagem);
  return match ? match.value : "Comprimido";
}

export default function EditMedicamento({ route, navigation }: any) {
  const { medicamento } = route.params;
  const { cores, tf } = useTema();

  // Bloco 1 — Identificação
  const [nome, setNome] = useState(medicamento?.nome || "");
  const [formato, setFormato] = useState(resolverFormato(medicamento?.dosagem));
  const [concentracao, setConcentracao] = useState(
    medicamento?.mg ? String(medicamento.mg) : ""
  );

  // Bloco 2 — Posologia
  const [qtdDose, setQtdDose] = useState(
    medicamento?.qtd_comprimidos ? String(medicamento.qtd_comprimidos) : ""
  );

  // Bloco 3 — Agendamento
  const [usoContinuo, setUsoContinuo] = useState(!!medicamento?.uso_continuo);
  const [duracaoDays, setDuracaoDays] = useState(
    medicamento?.duracao_days ? String(medicamento.duracao_days) : ""
  );
  const [horarios, setHorarios] = useState<string[]>(
    medicamento?.horarios || []
  );
  const [tempHorario, setTempHorario] = useState(new Date(2000, 0, 1, 8, 0));
  const [showHoraPicker, setShowHoraPicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [inicio, setInicio] = useState(
    medicamento?.inicio ? new Date(medicamento.inicio) : new Date()
  );
  const [showInicioPicker, setShowInicioPicker] = useState(false);

  const [salvando, setSalvando] = useState(false);

  const formatoAtual = FORMATOS.find((f) => f.value === formato) || FORMATOS[0];

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
      Alert.alert("Atenção", "Preencha o nome e pelo menos um horário!");
      return;
    }

    const payload: any = {
      nome,
      dosagem: formato,
      mg: concentracao ? parseFloat(concentracao) : null,
      qtd_comprimidos: qtdDose ? parseInt(qtdDose) : null,
      horarios,
      inicio: inicio.toISOString().split("T")[0],
      duracao_days: !usoContinuo && duracaoDays ? Number(duracaoDays) : null,
      uso_continuo: usoContinuo ? 1 : 0,
    };

    if (medicamento.grupo_repeticao) {
      Alert.alert(
        "Atualizar grupo",
        "Deseja aplicar estas alterações a todos os medicamentos pendentes deste grupo?",
        [
          { text: "Apenas este", onPress: () => salvar(payload, false) },
          { text: "Todos pendentes", style: "default", onPress: () => salvar(payload, true) },
          { text: "Cancelar", style: "cancel" },
        ]
      );
    } else {
      salvar(payload, false);
    }
  };

  const salvar = async (payload: any, atualizarGrupo: boolean) => {
    setSalvando(true);
    try {
      const url = atualizarGrupo
        ? `/medicamentos/${medicamento.medicamento_id}?atualizar_grupo=true`
        : `/medicamentos/${medicamento.medicamento_id}`;
      await api.patch(url, payload);
      Alert.alert("Sucesso", "Medicamento atualizado!");
      navigation.goBack();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: cores.primary, fontSize: tf(24) }]}>
          Editar Medicamento
        </Text>

        {/* ━━━━━━━━━━━━━━━━━━ Bloco 1 — Detalhes ━━━━━━━━━━━━━━━━━━ */}
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
        </View>

        {/* ━━━━━━━━━━━━━━━━━━ Bloco 2 — Posologia ━━━━━━━━━━━━━━━━━━ */}
        <View style={[styles.bloco, { backgroundColor: cores.card, borderColor: cores.border }]}>
          <View style={styles.blocoHeader}>
            <Ionicons name="timer-outline" size={20} color={cores.primary} />
            <Text style={[styles.blocoTitulo, { color: cores.text, fontSize: tf(15) }]}>
              Posologia
            </Text>
          </View>

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
              {formatoAtual.unit} por vez
            </Text>
          </View>
        </View>

        {/* ━━━━━━━━━━━━━━━━━━ Bloco 3 — Agendamento ━━━━━━━━━━━━━━━━━━ */}
        <View style={[styles.bloco, { backgroundColor: cores.card, borderColor: cores.border }]}>
          <View style={styles.blocoHeader}>
            <Ionicons name="calendar-outline" size={20} color={cores.primary} />
            <Text style={[styles.blocoTitulo, { color: cores.text, fontSize: tf(15) }]}>
              Quando lembrar?
            </Text>
          </View>

          {/* Tipo de tratamento */}
          <View style={[styles.tipoTratamento, { borderColor: cores.primary }]}>
            <TouchableOpacity
              style={[styles.tipoBtn, { borderColor: cores.primary }, !usoContinuo && { backgroundColor: cores.primary }]}
              onPress={() => setUsoContinuo(false)}
            >
              <Text style={[styles.tipoBtnText, { color: !usoContinuo ? "#fff" : cores.primary }]}>
                Temporário
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tipoBtn, { borderColor: cores.primary }, usoContinuo && { backgroundColor: cores.primary }]}
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
          <Text style={[styles.fieldLabel, { color: cores.text, fontSize: tf(14), marginTop: 10 }]}>
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
                  <TouchableOpacity onPress={() => removerHorario(h)}>
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
              is24Hour
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
            <Text style={[{ color: cores.text, fontWeight: "600" }]}>
              Início: {inicio.toLocaleDateString("pt-BR")}
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
            <Text style={styles.buttonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: cores.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[{ color: cores.muted, fontWeight: "600", fontSize: 16 }]}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
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
  tipoTratamento: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
  },
  tipoBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
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
});
