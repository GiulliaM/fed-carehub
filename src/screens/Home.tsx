import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import "dayjs/locale/pt-br";
import api from "../config/api";
import { termoPaciente } from "../utils/terminologia";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale("pt-br");

export default function Home({ navigation }: any) {
  const { cores, tf } = useTema();
  const [user, setUser] = useState<any>(null);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [pacienteAtivo, setPacienteAtivo] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [membrosGrupo, setMembrosGrupo] = useState<any[]>([]);

  const [resumo, setResumo] = useState({
    tarefasTotal: 0,
    tarefasConcluidas: 0,
    tarefasPendentes: 0,
    medTotal: 0,
    medConcluidos: 0,
    medPendentes: 0,
  });

  const hoje = dayjs().format("YYYY-MM-DD");
  const termo = termoPaciente(user?.tipo);

  async function load() {
    setCarregando(true);
    try {
      const rawUser = await AsyncStorage.getItem("usuario");
      if (rawUser) {
        const userData = JSON.parse(rawUser);
        setUser(userData);
      }

      const listaPacientes = await api.get("/pacientes");
      const lista = Array.isArray(listaPacientes) ? listaPacientes : [];
      setPacientes(lista);

      if (lista.length > 0) {
        const rawPac = await AsyncStorage.getItem("paciente_ativo_id");
        const savedId = rawPac ? parseInt(rawPac) : null;
        const found = lista.find((p: any) => p.paciente_id === savedId);
        const ativo = found || lista[0];
        setPacienteAtivo(ativo);
        await AsyncStorage.setItem(
          "paciente_ativo_id",
          String(ativo.paciente_id)
        );
        await AsyncStorage.setItem("paciente", JSON.stringify(ativo));
      } else {
        setPacienteAtivo(null);
      }
    } catch {
      setPacientes([]);
      setPacienteAtivo(null);
    }
    setCarregando(false);
  }

  const carregarDashboard = useCallback(async () => {
    if (!pacienteAtivo?.paciente_id) return;
    try {
      const [tarefas, med] = await Promise.all([
        api.get(`/tarefas?paciente_id=${pacienteAtivo.paciente_id}`),
        api.get(`/medicamentos/${pacienteAtivo.paciente_id}`),
      ]);

      const tarefasHoje = (tarefas || []).filter(
        (t: any) => t.data === hoje
      );
      const tarefasConcluidas = tarefasHoje.filter(
        (t: any) => t.concluida === 1
      ).length;

      const medHoje = (med || []).filter((m: any) => {
        if (!m.inicio) return false;
        const di = dayjs(m.inicio);
        if (m.uso_continuo == 1) return dayjs(hoje).isSameOrAfter(di, "day");
        if (m.duracao_days > 0) {
          const df = di.add(m.duracao_days - 1, "day");
          return (
            dayjs(hoje).isSameOrAfter(di, "day") &&
            dayjs(hoje).isSameOrBefore(df, "day")
          );
        }
        return dayjs(hoje).isSame(di, "day");
      });
      const medConcluidos = medHoje.filter(
        (m: any) => m.concluido === 1
      ).length;

      setResumo({
        tarefasTotal: tarefasHoje.length,
        tarefasConcluidas,
        tarefasPendentes: tarefasHoje.length - tarefasConcluidas,
        medTotal: medHoje.length,
        medConcluidos,
        medPendentes: medHoje.length - medConcluidos,
      });

      try {
        const membros = await api.get(
          `/grupo/membros/${pacienteAtivo.paciente_id}`
        );
        setMembrosGrupo(Array.isArray(membros) ? membros : []);
      } catch {
        setMembrosGrupo([]);
      }
    } catch {
      setResumo({
        tarefasTotal: 0,
        tarefasConcluidas: 0,
        tarefasPendentes: 0,
        medTotal: 0,
        medConcluidos: 0,
        medPendentes: 0,
      });
    }
  }, [pacienteAtivo?.paciente_id, hoje]);

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (pacienteAtivo?.paciente_id) carregarDashboard();
    }, [pacienteAtivo?.paciente_id, carregarDashboard])
  );

  useEffect(() => {
    if (pacienteAtivo?.paciente_id) carregarDashboard();
  }, [pacienteAtivo?.paciente_id]);

  const selecionarPaciente = async (p: any) => {
    setPacienteAtivo(p);
    await AsyncStorage.setItem("paciente_ativo_id", String(p.paciente_id));
    await AsyncStorage.setItem("paciente", JSON.stringify(p));
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: cores.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {carregando && (
          <ActivityIndicator
            size="large"
            color={cores.primary}
            style={{ marginTop: 40 }}
          />
        )}

        {!carregando && (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.welcome,
                    { color: cores.primary, fontSize: tf(22) },
                  ]}
                >
                  Ola, {user?.nome?.split(" ")[0] || "usuario"}
                </Text>
                <Text
                  style={[
                    styles.welcomeSubtitle,
                    { color: cores.muted, fontSize: tf(14) },
                  ]}
                >
                  Resumo do cuidado de hoje
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.settingsBtn, { backgroundColor: cores.card }]}
                onPress={() => navigation.navigate("Configuracoes")}
              >
                <Ionicons
                  name="settings-outline"
                  size={22}
                  color={cores.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Seletor de paciente */}
            {pacientes.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.pacienteSelectorRow}
              >
                {pacientes.map((p: any) => {
                  const isActive =
                    p.paciente_id === pacienteAtivo?.paciente_id;
                  return (
                    <TouchableOpacity
                      key={p.paciente_id}
                      style={[
                        styles.pacienteChip,
                        {
                          backgroundColor: isActive
                            ? cores.primary
                            : cores.card,
                          borderColor: isActive
                            ? cores.primary
                            : cores.border,
                        },
                      ]}
                      onPress={() => selecionarPaciente(p)}
                    >
                      <Ionicons
                        name="heart-outline"
                        size={16}
                        color={isActive ? "#fff" : cores.primary}
                      />
                      <Text
                        style={{
                          color: isActive ? "#fff" : cores.text,
                          fontWeight: "600",
                          fontSize: tf(13),
                          marginLeft: 4,
                        }}
                      >
                        {p.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Info do paciente */}
            <View style={[styles.card, { backgroundColor: cores.card, borderColor: cores.border }]}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="heart-outline" size={20} color={cores.primary} />
                <Text style={[styles.cardTitle, { color: cores.text, fontSize: tf(17) }]}>
                  {termo}
                </Text>
              </View>

              {pacienteAtivo ? (
                <>
                  <Text style={[styles.cardInfo, { color: cores.text, fontSize: tf(15) }]}>
                    <Text style={[styles.cardLabel, { color: cores.primary }]}>Nome: </Text>
                    {pacienteAtivo.nome}
                  </Text>
                  <Text style={[styles.cardInfo, { color: cores.text, fontSize: tf(15) }]}>
                    <Text style={[styles.cardLabel, { color: cores.primary }]}>Idade: </Text>
                    {pacienteAtivo.idade || "Nao informada"}
                  </Text>

                  <View style={styles.patientActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: cores.primary }]}
                      onPress={() =>
                        navigation.navigate("HistoricoMedico", {
                          paciente: pacienteAtivo,
                        })
                      }
                    >
                      <Feather name="file-text" size={14} color="#fff" />
                      <Text style={styles.actionBtnText}>Historico</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: cores.primary }]}
                      onPress={() =>
                        navigation.navigate("EditarPaciente", {
                          paciente: pacienteAtivo,
                        })
                      }
                    >
                      <Feather name="edit-2" size={14} color="#fff" />
                      <Text style={styles.actionBtnText}>Editar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 12 }}>
                  <Text style={[styles.emptyText, { color: cores.muted, fontSize: tf(14) }]}>
                    Nenhum {termo.toLowerCase()} vinculado.
                  </Text>
                  <View style={styles.emptyActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: cores.primary }]}
                      onPress={() => navigation.navigate("CadastrarPaciente")}
                    >
                      <Ionicons name="add-outline" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Cadastrar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: cores.accent }]}
                      onPress={() => navigation.navigate("VincularCuidador")}
                    >
                      <Ionicons name="link-outline" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Vincular</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Resumo do dia */}
            {pacienteAtivo && (
              <View style={[styles.card, { backgroundColor: cores.card, borderColor: cores.border }]}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="bar-chart-outline" size={20} color={cores.primary} />
                  <Text style={[styles.cardTitle, { color: cores.text, fontSize: tf(17) }]}>
                    Resumo de Hoje
                  </Text>
                </View>

                <View style={styles.summaryTable}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryHeader, { color: cores.muted, fontSize: tf(12) }]}> </Text>
                    <Text style={[styles.summaryHeader, { color: cores.muted, fontSize: tf(12) }]}>Total</Text>
                    <Text style={[styles.summaryHeader, { color: cores.success, fontSize: tf(12) }]}>Feito</Text>
                    <Text style={[styles.summaryHeader, { color: cores.warning, fontSize: tf(12) }]}>Pendente</Text>
                  </View>

                  <View style={[styles.summaryRow, { backgroundColor: cores.background }]}>
                    <View style={styles.summaryLabelRow}>
                      <Ionicons name="checkbox-outline" size={16} color={cores.primary} />
                      <Text style={[styles.summaryLabel, { color: cores.text, fontSize: tf(14) }]}>Tarefas</Text>
                    </View>
                    <Text style={[styles.summaryVal, { color: cores.text, fontSize: tf(14) }]}>{resumo.tarefasTotal}</Text>
                    <Text style={[styles.summaryVal, { color: cores.success, fontSize: tf(14) }]}>{resumo.tarefasConcluidas}</Text>
                    <Text style={[styles.summaryVal, { color: cores.warning, fontSize: tf(14) }]}>{resumo.tarefasPendentes}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <View style={styles.summaryLabelRow}>
                      <Ionicons name="medical-outline" size={16} color={cores.primary} />
                      <Text style={[styles.summaryLabel, { color: cores.text, fontSize: tf(14) }]}>Medicamentos</Text>
                    </View>
                    <Text style={[styles.summaryVal, { color: cores.text, fontSize: tf(14) }]}>{resumo.medTotal}</Text>
                    <Text style={[styles.summaryVal, { color: cores.success, fontSize: tf(14) }]}>{resumo.medConcluidos}</Text>
                    <Text style={[styles.summaryVal, { color: cores.warning, fontSize: tf(14) }]}>{resumo.medPendentes}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Grupo de cuidado */}
            {pacienteAtivo && membrosGrupo.length > 0 && (
              <View style={[styles.card, { backgroundColor: cores.card, borderColor: cores.border }]}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="people-outline" size={20} color={cores.primary} />
                  <Text style={[styles.cardTitle, { color: cores.text, fontSize: tf(17) }]}>
                    Grupo de Cuidado: {pacienteAtivo.nome}
                  </Text>
                </View>
                {membrosGrupo.map((m: any) => (
                  <View key={m.usuario_id} style={styles.membroRow}>
                    <Ionicons
                      name={
                        m.tipo === "cuidador"
                          ? "medkit-outline"
                          : "person-outline"
                      }
                      size={18}
                      color={cores.primary}
                    />
                    <Text style={[{ color: cores.text, fontSize: tf(14), marginLeft: 8 }]}>
                      {m.nome}
                    </Text>
                    <Text style={[{ color: cores.muted, fontSize: tf(12), marginLeft: 6 }]}>
                      ({m.papel})
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Acesso rapido */}
            <Text style={[styles.sectionTitle, { color: cores.primary, fontSize: tf(18) }]}>
              Acesso rapido
            </Text>

            <View style={styles.quickGrid}>
              {[
                { name: "Tarefas", icon: "checkbox-outline" as const, screen: "Tarefas" },
                { name: "Medicamentos", icon: "medical-outline" as const, screen: "Medicamentos" },
                { name: "Diario", icon: "book-outline" as const, screen: "Diario" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.screen}
                  style={[styles.quickCard, { backgroundColor: cores.card, borderColor: cores.border }]}
                  onPress={() => navigation.navigate(item.screen)}
                >
                  <Ionicons name={item.icon} size={28} color={cores.primary} />
                  <Text style={[styles.quickText, { color: cores.text, fontSize: tf(13) }]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botoes vincular/cadastrar */}
            {pacienteAtivo && (
              <View style={styles.linkRow}>
                <TouchableOpacity
                  style={[styles.linkBtn, { backgroundColor: cores.card, borderColor: cores.border }]}
                  onPress={() => navigation.navigate("CadastrarPaciente")}
                >
                  <Ionicons name="add-circle-outline" size={20} color={cores.primary} />
                  <Text style={[styles.linkBtnText, { color: cores.text, fontSize: tf(13) }]}>
                    Cadastrar {termo.toLowerCase()}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.linkBtn, { backgroundColor: cores.card, borderColor: cores.border }]}
                  onPress={() => navigation.navigate("VincularCuidador")}
                >
                  <Ionicons name="link-outline" size={20} color={cores.primary} />
                  <Text style={[styles.linkBtnText, { color: cores.text, fontSize: tf(13) }]}>
                    Vincular pessoa
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  welcome: { fontWeight: "700" },
  welcomeSubtitle: { marginTop: 2 },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  pacienteSelectorRow: { marginBottom: 12 },
  pacienteChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: "700" },
  cardInfo: { marginBottom: 4 },
  cardLabel: { fontWeight: "700" },
  emptyText: { textAlign: "center", marginBottom: 12 },
  emptyActions: {
    flexDirection: "row",
    gap: 10,
  },
  patientActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  summaryTable: { marginTop: 4 },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  summaryHeader: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
  },
  summaryLabelRow: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryLabel: { fontWeight: "600" },
  summaryVal: { flex: 1, textAlign: "center", fontWeight: "700" },
  membroRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  sectionTitle: { fontWeight: "700", marginBottom: 10, marginTop: 4 },
  quickGrid: { flexDirection: "row", gap: 10, marginBottom: 14 },
  quickCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 1,
  },
  quickText: { marginTop: 6, fontWeight: "600" },
  linkRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  linkBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  linkBtnText: { fontWeight: "600" },
});
