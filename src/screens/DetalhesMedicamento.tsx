import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import api from "../config/api";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

export default function DetalhesMedicamento({ route, navigation }: any) {
  const { cores, tf } = useTema();
  const { medicamento } = route.params;

  const confirmarExclusao = () => {
    Alert.alert(
      "Excluir medicamento",
      `Deseja excluir "${medicamento.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/medicamentos/${medicamento.medicamento_id}`);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert("Erro", err?.response?.data?.message || "Não foi possível excluir o medicamento.");
            }
          },
        },
      ]
    );
  };

  if (!medicamento) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: cores.background }]}
      >
        <View style={styles.center}>
          <Text style={[{ color: cores.text, fontSize: tf(16) }]}>
            Medicamento nao encontrado.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.btnAction, { backgroundColor: cores.primary }]}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <Text style={styles.btnActionText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const InfoRow = ({
    icon,
    label,
    value,
  }: {
    icon: string;
    label: string;
    value: string;
  }) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color={cores.primary} />
      <Text style={[styles.infoText, { color: cores.text, fontSize: tf(15) }]}>
        {label}:{" "}
        <Text style={{ fontWeight: "700" }}>{value || "N/I"}</Text>
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: cores.background }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text
          style={[
            styles.title,
            { color: cores.primary, fontSize: tf(22) },
          ]}
        >
          Detalhes do Medicamento
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: cores.card, borderColor: cores.border },
          ]}
        >
          <View style={styles.headerCard}>
            <Ionicons
              name="medical-outline"
              size={28}
              color={cores.primary}
            />
            <Text
              style={[
                styles.cardTitle,
                { color: cores.text, fontSize: tf(20) },
              ]}
            >
              {medicamento.nome}
            </Text>
          </View>

          {medicamento.dosagem && (
            <InfoRow
              icon="medical-outline"
              label="Formato"
              value={medicamento.dosagem}
            />
          )}
          {medicamento.mg && (
            <InfoRow
              icon="fitness-outline"
              label="Concentração"
              value={`${medicamento.mg}`}
            />
          )}
          {medicamento.dosagem === "Pomada" && medicamento.local_aplicacao ? (
            <InfoRow
              icon="hand-left-outline"
              label="Aplicar em"
              value={medicamento.local_aplicacao}
            />
          ) : medicamento.qtd_comprimidos ? (
            <InfoRow
              icon="timer-outline"
              label="Posologia"
              value={`${medicamento.qtd_comprimidos} ${medicamento.dosagem === "Gotas" ? "gotas" : medicamento.dosagem === "Mililitros" ? "mL" : medicamento.dosagem === "Injecao" ? "mL" : "comprimido(s)"} por vez`}
            />
          ) : null}
          <InfoRow
            icon="time-outline"
            label="Horarios"
            value={
              Array.isArray(medicamento.horarios)
                ? medicamento.horarios.join(", ")
                : medicamento.horarios
            }
          />
          <InfoRow
            icon="calendar-outline"
            label="Inicio"
            value={
              medicamento.inicio
                ? dayjs(medicamento.inicio).format("DD/MM/YYYY")
                : ""
            }
          />
          {medicamento.data_fim && (
            <InfoRow
              icon="calendar-clear-outline"
              label="Termino"
              value={dayjs(medicamento.data_fim).format("DD/MM/YYYY")}
            />
          )}
          <InfoRow
            icon="hourglass-outline"
            label="Tratamento"
            value={
              medicamento.uso_continuo
                ? "Contínuo"
                : medicamento.duracao_days
                ? `Temporário — ${medicamento.duracao_days} dias`
                : "Temporário"
            }
          />
          {medicamento.intervalo_horas && (
            <InfoRow
              icon="repeat-outline"
              label="Intervalo"
              value={`${medicamento.intervalo_horas}h`}
            />
          )}
        </View>

        {/* Botao Editar */}
        <TouchableOpacity
          style={[styles.btnAction, { backgroundColor: cores.primary }]}
          onPress={() =>
            navigation.navigate("EditMedicamento", { medicamento })
          }
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.btnActionText}>Editar medicamento</Text>
        </TouchableOpacity>

        {/* Botao Excluir */}
        <TouchableOpacity
          style={[styles.btnAction, { backgroundColor: cores.danger }]}
          onPress={confirmarExclusao}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.btnActionText}>Excluir medicamento</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btnAction,
            {
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: cores.border,
            },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back-outline"
            size={18}
            color={cores.text}
          />
          <Text style={[styles.btnActionText, { color: cores.text }]}>
            Voltar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontWeight: "700", textAlign: "center", marginBottom: 16 },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  cardTitle: { fontWeight: "700" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  infoText: { flexShrink: 1 },
  btnAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 6,
  },
  btnActionText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
