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
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/clienteApi";
import { useTema } from "../context/ThemeContext";

export default function EditMedicamento({ route, navigation }: any) {
  const { medicamento } = route.params;
  const { cores, tf } = useTema();

  const [nome, setNome] = useState(medicamento?.nome || "");
  const [dosagem, setDosagem] = useState(medicamento?.dosagem || "");
  const [mg, setMg] = useState(
    medicamento?.mg ? String(medicamento.mg) : ""
  );
  const [qtdComprimidos, setQtdComprimidos] = useState(
    medicamento?.qtd_comprimidos
      ? String(medicamento.qtd_comprimidos)
      : ""
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

  const [duracaoDays, setDuracaoDays] = useState(
    medicamento?.duracao_days ? String(medicamento.duracao_days) : ""
  );
  const [usoContinuo, setUsoContinuo] = useState(
    !!medicamento?.uso_continuo
  );
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
      Alert.alert("Atencao", "Preencha o nome e pelo menos um horario!");
      return;
    }

    const payload: any = {
      nome,
      dosagem: dosagem || null,
      mg: mg ? parseFloat(mg) : null,
      qtd_comprimidos: qtdComprimidos ? parseInt(qtdComprimidos) : null,
      horarios,
      inicio: inicio.toISOString().split("T")[0],
      duracao_days: duracaoDays !== "" ? Number(duracaoDays) : null,
      uso_continuo: usoContinuo ? 1 : 0,
    };

    if (medicamento.grupo_repeticao) {
      Alert.alert(
        "Atualizar grupo",
        "Deseja aplicar estas alteracoes a todos os medicamentos pendentes deste grupo?",
        [
          {
            text: "Apenas este",
            onPress: () => salvar(payload, false),
          },
          {
            text: "Todos pendentes",
            style: "default",
            onPress: () => salvar(payload, true),
          },
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
      Alert.alert("Erro", "Nao foi possivel salvar as alteracoes.");
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
          Editar Medicamento
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
            placeholder="mg"
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
          placeholder="Dosagem"
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
          Horarios ({horarios.length})
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
                <TouchableOpacity onPress={() => removerHorario(h)}>
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
            is24Hour
            display="spinner"
            onChange={(e, date) => {
              setShowHoraPicker(false);
              if (date) confirmarHorario(date);
            }}
          />
        )}

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
          <Text style={[{ color: cores.text, fontWeight: "600" }]}>
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
              { color: cores.text, fontWeight: "600", fontSize: tf(15) },
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
            <Text style={styles.buttonText}>Salvar Alteracoes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: cores.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[{ color: cores.muted, fontWeight: "600" }]}>
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
  sectionLabel: { fontWeight: "700", marginBottom: 8 },
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
  horarioEditArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  horarioText: { fontWeight: "700", fontSize: 15, marginRight: 4 },
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
});
