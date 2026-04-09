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
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../config/api";
import { useTema } from "../context/ThemeContext";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

export default function EditTarefa({ route, navigation }: any) {
  const { tarefa, modoVisualizacao: initView } = route.params;
  const { cores, tf } = useTema();

  const [editando, setEditando] = useState(!initView);
  const [titulo, setTitulo] = useState(tarefa.titulo);
  const [detalhes, setDetalhes] = useState(tarefa.detalhes || "");
  const [data, setData] = useState<Date>(
    tarefa.data
      ? dayjs(tarefa.data).startOf("day").toDate()
      : dayjs().startOf("day").toDate()
  );
  const [hora, setHora] = useState<Date>(
    tarefa.hora
      ? dayjs(`1970-01-01 ${tarefa.hora}`).toDate()
      : dayjs().toDate()
  );
  const [showDataPicker, setShowDataPicker] = useState(false);
  const [showHoraPicker, setShowHoraPicker] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const formatarHoraDB = (d: Date) => {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}:00`;
  };

  const handleSalvar = async () => {
    if (!titulo.trim()) {
      Alert.alert("Atencao", "O titulo nao pode ficar vazio.");
      return;
    }
    setSalvando(true);
    try {
      await api.patch(`/tarefas/${tarefa.tarefa_id}`, {
        titulo,
        detalhes,
        data: dayjs(data).format("YYYY-MM-DD"),
        hora: formatarHoraDB(hora),
        concluida: tarefa.concluida ? 1 : 0,
      });
      Alert.alert("Sucesso", "Tarefa atualizada com sucesso!");
      navigation.goBack();
    } catch {
      Alert.alert("Erro", "Nao foi possivel atualizar a tarefa.");
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = () => {
    Alert.alert("Excluir", "Deseja realmente excluir esta tarefa?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/tarefas/${tarefa.tarefa_id}`);
            navigation.goBack();
          } catch {
            Alert.alert("Erro", "Nao foi possivel excluir.");
          }
        },
      },
    ]);
  };

  // MODO VISUALIZACAO
  if (!editando) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: cores.background }]}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text
            style={[
              styles.title,
              { color: cores.primary, fontSize: tf(22) },
            ]}
          >
            Detalhes da Tarefa
          </Text>

          <View
            style={[
              styles.card,
              { backgroundColor: cores.card, borderColor: cores.border },
            ]}
          >
            <View style={styles.detailRow}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={cores.primary}
              />
              <Text
                style={[
                  styles.detailLabel,
                  { color: cores.muted, fontSize: tf(13) },
                ]}
              >
                Titulo
              </Text>
            </View>
            <Text
              style={[
                styles.detailValue,
                { color: cores.text, fontSize: tf(17) },
              ]}
            >
              {tarefa.titulo}
            </Text>

            {tarefa.detalhes ? (
              <>
                <View style={[styles.detailRow, { marginTop: 14 }]}>
                  <Ionicons
                    name="chatbox-outline"
                    size={18}
                    color={cores.primary}
                  />
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: cores.muted, fontSize: tf(13) },
                    ]}
                  >
                    Detalhes
                  </Text>
                </View>
                <Text
                  style={[
                    styles.detailValue,
                    { color: cores.text, fontSize: tf(15) },
                  ]}
                >
                  {tarefa.detalhes}
                </Text>
              </>
            ) : null}

            <View style={[styles.detailRow, { marginTop: 14 }]}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={cores.primary}
              />
              <Text
                style={[
                  styles.detailLabel,
                  { color: cores.muted, fontSize: tf(13) },
                ]}
              >
                Data
              </Text>
            </View>
            <Text
              style={[
                styles.detailValue,
                { color: cores.text, fontSize: tf(15) },
              ]}
            >
              {dayjs(tarefa.data).format("DD/MM/YYYY")}
            </Text>

            <View style={[styles.detailRow, { marginTop: 14 }]}>
              <Ionicons
                name="time-outline"
                size={18}
                color={cores.primary}
              />
              <Text
                style={[
                  styles.detailLabel,
                  { color: cores.muted, fontSize: tf(13) },
                ]}
              >
                Horario
              </Text>
            </View>
            <Text
              style={[
                styles.detailValue,
                { color: cores.text, fontSize: tf(15) },
              ]}
            >
              {tarefa.hora ? tarefa.hora.slice(0, 5) : "Nao definido"}
            </Text>

            <View style={[styles.detailRow, { marginTop: 14 }]}>
              <Ionicons
                name={
                  tarefa.concluida === 1
                    ? "checkbox"
                    : "square-outline"
                }
                size={18}
                color={
                  tarefa.concluida === 1
                    ? cores.success
                    : cores.warning
                }
              />
              <Text
                style={[
                  styles.detailLabel,
                  { color: cores.muted, fontSize: tf(13) },
                ]}
              >
                Status
              </Text>
            </View>
            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    tarefa.concluida === 1
                      ? cores.success
                      : cores.warning,
                  fontSize: tf(15),
                },
              ]}
            >
              {tarefa.concluida === 1 ? "Concluida" : "Pendente"}
            </Text>

            {tarefa.hora_conclusao && (
              <>
                <View style={[styles.detailRow, { marginTop: 14 }]}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={cores.success}
                  />
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: cores.muted, fontSize: tf(13) },
                    ]}
                  >
                    Concluida em
                  </Text>
                </View>
                <Text
                  style={[
                    styles.detailValue,
                    { color: cores.text, fontSize: tf(15) },
                  ]}
                >
                  {dayjs(tarefa.hora_conclusao).format(
                    "DD/MM/YYYY HH:mm"
                  )}
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.btnPrimary,
              { backgroundColor: cores.primary },
            ]}
            onPress={() => setEditando(true)}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>Editar tarefa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnPrimary,
              { backgroundColor: cores.danger },
            ]}
            onPress={handleExcluir}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>Excluir tarefa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnOutline,
              { borderColor: cores.border },
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[{ color: cores.muted, fontWeight: "600" }]}>
              Voltar
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // MODO EDICAO
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: cores.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text
          style={[
            styles.title,
            { color: cores.primary, fontSize: tf(22) },
          ]}
        >
          Editar Tarefa
        </Text>

        <Text
          style={[styles.label, { color: cores.text, fontSize: tf(14) }]}
        >
          Titulo *
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
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text
          style={[styles.label, { color: cores.text, fontSize: tf(14) }]}
        >
          Detalhes
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              height: 100,
              backgroundColor: cores.inputBg,
              color: cores.inputText,
              borderColor: cores.border,
            },
          ]}
          value={detalhes}
          onChangeText={setDetalhes}
          multiline
        />

        <TouchableOpacity
          style={[
            styles.selectButton,
            { backgroundColor: cores.inputBg, borderColor: cores.border },
          ]}
          onPress={() => setShowDataPicker(true)}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={cores.primary}
          />
          <Text style={[{ color: cores.text, fontWeight: "600" }]}>
            Data: {dayjs(data).format("DD/MM/YYYY")}
          </Text>
        </TouchableOpacity>
        {showDataPicker && (
          <DateTimePicker
            value={data}
            mode="date"
            onChange={(e, dateSel) => {
              setShowDataPicker(false);
              if (dateSel) setData(dateSel);
            }}
          />
        )}

        <TouchableOpacity
          style={[
            styles.selectButton,
            { backgroundColor: cores.inputBg, borderColor: cores.border },
          ]}
          onPress={() => setShowHoraPicker(true)}
        >
          <Ionicons
            name="time-outline"
            size={18}
            color={cores.primary}
          />
          <Text style={[{ color: cores.text, fontWeight: "600" }]}>
            Hora: {dayjs(hora).format("HH:mm")}
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
              if (dateSel) setHora(dateSel);
            }}
          />
        )}

        <TouchableOpacity
          style={[
            styles.btnPrimary,
            { backgroundColor: cores.primary },
          ]}
          onPress={handleSalvar}
          disabled={salvando}
        >
          {salvando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>Salvar Alteracoes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnOutline, { borderColor: cores.border }]}
          onPress={() =>
            initView ? setEditando(false) : navigation.goBack()
          }
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
  title: { fontWeight: "700", marginBottom: 16, textAlign: "center" },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  detailLabel: { fontWeight: "600" },
  detailValue: { fontWeight: "500", marginLeft: 26 },
  label: { fontWeight: "600", marginBottom: 6, marginTop: 10 },
  input: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 6,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnOutline: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
  },
});
