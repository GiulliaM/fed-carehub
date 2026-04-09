import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTema } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../config/api";
import { Ionicons } from "@expo/vector-icons";

export default function NovaMedicamento({ navigation }: any) {
  const { cores, tf } = useTema();

  const [nome, setNome] = useState("");
  const [dosagem, setDosagem] = useState("");
  const [mg, setMg] = useState("");
  const [qtdComprimidos, setQtdComprimidos] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [tempHorario, setTempHorario] = useState(new Date());
  const [showHoraPicker, setShowHoraPicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [inicio, setInicio] = useState(new Date());
  const [showInicioPicker, setShowInicioPicker] = useState(false);

  const [duracaoDays, setDuracaoDays] = useState("");
  const [usoContinuo, setUsoContinuo] = useState(false);
  const [salvando, setSalvando] = useState(false);

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
      Alert.alert("Aviso", "Preencha o nome e pelo menos um horario!");
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

      await api.post("/medicamentos", {
        nome,
        dosagem: dosagem || null,
        mg: mg ? parseFloat(mg) : null,
        qtd_comprimidos: qtdComprimidos ? parseInt(qtdComprimidos) : null,
        horarios,
        concluido: 0,
        inicio: inicio.toISOString().split("T")[0],
        duracao_days: duracaoDays ? Number(duracaoDays) : null,
        uso_continuo: usoContinuo ? 1 : 0,
        paciente_id: paciente.paciente_id,
      });

      Alert.alert("Sucesso", "Medicamento cadastrado com sucesso!");
      navigation.goBack();
    } catch (err) {
      console.error("Erro ao salvar medicamento:", err);
      Alert.alert("Erro", "Nao foi possivel salvar o medicamento.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: cores.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text
          style={[
            styles.title,
            { color: cores.primary, fontSize: tf(24) },
          ]}
        >
          Novo Medicamento
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: cores.inputBg,
              color: cores.inputText,
              borderColor: cores.border,
            },
          ]}
          placeholder="Nome do medicamento"
          placeholderTextColor={cores.inputPlaceholder}
          value={nome}
          onChangeText={setNome}
        />

        {/* Dosagem ou mg + qtd */}
        <View style={styles.row}>
          <TextInput
            style={[
              styles.input,
              {
                flex: 1,
                backgroundColor: cores.inputBg,
                color: cores.inputText,
                borderColor: cores.border,
              },
            ]}
            placeholder="mg (ex: 500)"
            placeholderTextColor={cores.inputPlaceholder}
            keyboardType="numeric"
            value={mg}
            onChangeText={setMg}
          />
          <TextInput
            style={[
              styles.input,
              {
                flex: 1,
                backgroundColor: cores.inputBg,
                color: cores.inputText,
                borderColor: cores.border,
              },
            ]}
            placeholder="Qtd comprimidos"
            placeholderTextColor={cores.inputPlaceholder}
            keyboardType="numeric"
            value={qtdComprimidos}
            onChangeText={setQtdComprimidos}
          />
        </View>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: cores.inputBg,
              color: cores.inputText,
              borderColor: cores.border,
            },
          ]}
          placeholder="Dosagem (ex: 1 comprimido)"
          placeholderTextColor={cores.inputPlaceholder}
          value={dosagem}
          onChangeText={setDosagem}
        />

        {/* Horarios */}
        <Text
          style={[
            styles.sectionLabel,
            { color: cores.text, fontSize: tf(15) },
          ]}
        >
          Horarios {horarios.length > 0 ? `(${horarios.length})` : ""}
        </Text>

        {horarios.length > 0 && (
          <View style={styles.horariosContainer}>
            {horarios.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.horarioItem,
                  { backgroundColor: cores.primary + "20" },
                ]}
              >
                <TouchableOpacity
                  style={styles.horarioEditArea}
                  onPress={() => abrirPickerEditar(i)}
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={cores.primary}
                  />
                  <Text
                    style={[styles.horarioText, { color: cores.primary }]}
                  >
                    {h}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.horarioRemoveBtn}
                  onPress={() => removerHorario(h)}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={cores.danger}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.addHorarioBtn, { borderColor: cores.primary }]}
          onPress={abrirPickerNovo}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color={cores.primary}
          />
          <Text
            style={[styles.addHorarioBtnText, { color: cores.primary }]}
          >
            Adicionar horario
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

        {/* Data de inicio */}
        <TouchableOpacity
          style={[
            styles.btnSelect,
            { backgroundColor: cores.inputBg, borderColor: cores.border },
          ]}
          onPress={() => setShowInicioPicker(true)}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={cores.text}
          />
          <Text
            style={[
              styles.btnSelectText,
              { color: cores.text, fontSize: tf(15) },
            ]}
          >
            Inicio: {inicio.toLocaleDateString("pt-BR")}
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

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: cores.inputBg,
              color: cores.inputText,
              borderColor: cores.border,
            },
          ]}
          placeholder="Duracao (em dias)"
          placeholderTextColor={cores.inputPlaceholder}
          keyboardType="numeric"
          value={duracaoDays}
          onChangeText={setDuracaoDays}
        />

        <View style={styles.switchRow}>
          <Text
            style={[
              styles.switchLabel,
              { color: cores.text, fontSize: tf(15) },
            ]}
          >
            Uso continuo
          </Text>
          <Switch
            value={usoContinuo}
            onValueChange={setUsoContinuo}
            trackColor={{
              false: cores.border,
              true: cores.primary + "80",
            }}
            thumbColor={usoContinuo ? cores.primary : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity
          disabled={salvando}
          style={[
            styles.button,
            { backgroundColor: salvando ? cores.muted : cores.primary },
          ]}
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
          <Text
            style={[styles.cancelButtonText, { color: cores.muted }]}
          >
            Cancelar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16 },
  title: { fontWeight: "700", textAlign: "center", marginBottom: 18 },
  row: { flexDirection: "row", gap: 10 },
  input: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
    fontSize: 16,
  },
  btnSelect: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnSelectText: { fontWeight: "600" },
  sectionLabel: { fontWeight: "700", marginBottom: 8, marginTop: 4 },
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
    marginBottom: 14,
    gap: 6,
  },
  addHorarioBtnText: { fontSize: 15, fontWeight: "600" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  switchLabel: { fontWeight: "600" },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
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
