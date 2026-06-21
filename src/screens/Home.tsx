import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  InteractionManager
} from "react-native";
import { Text } from "../components/Text";
import { AnimatedPressable as TouchableOpacity } from "../components/AnimatedPressable";

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
import { calcularIdade } from "../ferramentas/logicaData";
import { onboardingFoiVisto } from "../utils/onboarding";

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
  const [historicoVazio, setHistoricoVazio] = useState(false);
  const [perfilCuid, setPerfilCuid] = useState<any>(null);

  const [artigos, setArtigos] = useState<any[]>([]);

  const [resumo, setResumo] = useState({
    tarefasTotal: 0,
    tarefasConcluidas: 0,
    tarefasPendentes: 0,
    medTotal: 0,
    medConcluidos: 0,
    medPendentes: 0,
  });

  const [refreshing, setRefreshing] = useState(false);

  const hoje = dayjs().format("YYYY-MM-DD");
  const termo = termoPaciente(user?.tipo);

  async function load() {
    setCarregando(true);
    try {
      const rawUser = await AsyncStorage.getItem("usuario");
      const userData = rawUser ? JSON.parse(rawUser) : null;
      if (userData) setUser(userData);

      const [listaPacientes, resArtigos] = await Promise.all([
        api.get("/pacientes"),
        api.get("/artigos").catch(() => ({ data: [] })),
      ]);
      const lista = Array.isArray(listaPacientes.data) ? listaPacientes.data : [];
      setPacientes(lista);
      setArtigos(Array.isArray(resArtigos.data) ? resArtigos.data.slice(0, 10) : []);

      // perfil profissional do cuidador (para os lembretes)
      if (userData?.tipo === "cuidador") {
        try {
          const rp = await api.get("/cuidador/perfil");
          setPerfilCuid(rp.data || null);
        } catch {
          setPerfilCuid(null);
        }
      } else {
        setPerfilCuid(null);
      }

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
      const [tarefas, agenda] = await Promise.all([
        api.get(`/tarefas?paciente_id=${pacienteAtivo.paciente_id}`),
        api.get(`/medicamentos/${pacienteAtivo.paciente_id}/agenda/${hoje}`),
      ]);

      const tarefasHoje = (Array.isArray(tarefas.data) ? tarefas.data : []).filter(
        (t: any) => String(t.data).substring(0, 10) === hoje
      );
      const tarefasConcluidas = tarefasHoje.filter(
        (t: any) => t.concluida === 1
      ).length;

      const slots = Array.isArray(agenda.data) ? agenda.data : [];
      const medTotal = slots.length;
      const medConcluidos = slots.filter((s: any) => s.tomado).length;

      setResumo({
        tarefasTotal: tarefasHoje.length,
        tarefasConcluidas,
        tarefasPendentes: tarefasHoje.length - tarefasConcluidas,
        medTotal,
        medConcluidos,
        medPendentes: medTotal - medConcluidos,
      });

      try {
        const membros = await api.get(
          `/grupo/membros/${pacienteAtivo.paciente_id}`
        );
        setMembrosGrupo(Array.isArray(membros.data) ? membros.data : []);
      } catch {
        setMembrosGrupo([]);
      }

      try {
        const hist = await api.get(`/pacientes/${pacienteAtivo.paciente_id}/historico-medico`);
        const h: any = hist.data || {};
        const campos = [
          h.condicoes_cronicas, h.alergias, h.historico_cirurgico, h.tipo_sanguineo,
          h.plano_saude_nome, h.plano_saude_numero, h.medico_responsavel,
          h.telefone_medico, h.capacidade_funcional, h.observacoes_gerais,
        ];
        const temContato = Array.isArray(h.contatos_emergencia) && h.contatos_emergencia.length > 0;
        const algumPreenchido = campos.some((c) => c != null && String(c).trim() !== "") || temContato;
        setHistoricoVazio(!algumPreenchido);
      } catch {
        setHistoricoVazio(false);
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

  // mostra o tutorial de boas-vindas 1x pro usuario novo.
  // usa useFocusEffect + InteractionManager pra disparar so quando a Home ja
  // esta estavel e em foco (se navegar durante a transicao do reset, a chamada e descartada).
  const onboardingChecado = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (onboardingChecado.current) return;
      onboardingChecado.current = true;
      const tarefa = InteractionManager.runAfterInteractions(async () => {
        try {
          const raw = await AsyncStorage.getItem("usuario");
          const usuario = raw ? JSON.parse(raw) : null;
          const visto = await onboardingFoiVisto(usuario?.usuario_id);
          if (!visto) navigation.navigate("Onboarding");
        } catch {}
      });
      return () => tarefa.cancel();
    }, [navigation])
  );

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  // Lembretes de dados pendentes (familiar), em ordem de importancia.
  // Exibimos no maximo 2 por vez pra nao poluir a Home.
  const lembretes: { key: string; icon: any; titulo: string; texto: string; onPress: () => void }[] = [];
  if (user?.tipo !== "cuidador") {
    if (pacientes.length === 0) {
      lembretes.push({
        key: "paciente",
        icon: "alert-circle",
        titulo: `Cadastre seu ${termo.toLowerCase()}`,
        texto: "Você ainda não cadastrou. Toque para começar.",
        onPress: () => navigation.navigate("CadastrarPaciente"),
      });
    } else if (pacienteAtivo) {
      if (historicoVazio) {
        lembretes.push({
          key: "historico",
          icon: "medkit-outline",
          titulo: "Complete o histórico médico",
          texto: `Adicione o histórico de ${pacienteAtivo.nome}.`,
          onPress: () => navigation.navigate("HistoricoMedico", { paciente: pacienteAtivo }),
        });
      }
      if (!user?.telefone || !String(user.telefone).trim()) {
        lembretes.push({
          key: "telefone",
          icon: "call-outline",
          titulo: "Adicione seu telefone",
          texto: "Mantenha seu contato atualizado no perfil.",
          onPress: () => navigation.navigate("EditarUsuario", { user }),
        });
      }
      if (!pacienteAtivo.data_nascimento) {
        lembretes.push({
          key: "nascimento",
          icon: "calendar-outline",
          titulo: "Informe a data de nascimento",
          texto: `Complete os dados de ${pacienteAtivo.nome}.`,
          onPress: () => navigation.navigate("EditarPaciente", { paciente: pacienteAtivo }),
        });
      }
    }
  }
  if (user?.tipo === "cuidador") {
    if (pacientes.length === 0) {
      lembretes.push({
        key: "vincular",
        icon: "link-outline",
        titulo: "Vincule um paciente",
        texto: "Peça o código de 6 dígitos ao familiar para começar.",
        onPress: () => navigation.navigate("MeusPacientes", { abrirCodigo: true }),
      });
    }
    if (perfilCuid) {
      const qtdEsp = Array.isArray(perfilCuid.especialidades) ? perfilCuid.especialidades.length : 0;
      if (qtdEsp === 0) {
        lembretes.push({
          key: "especialidades",
          icon: "ribbon-outline",
          titulo: "Adicione suas especialidades",
          texto: "Ajuda as famílias a encontrarem você na busca.",
          onPress: () => navigation.navigate("PerfilCuidador"),
        });
      }
      if (!perfilCuid.bio || !String(perfilCuid.bio).trim()) {
        lembretes.push({
          key: "bio",
          icon: "create-outline",
          titulo: "Escreva sua apresentação",
          texto: "Uma bio aumenta a confiança das famílias.",
          onPress: () => navigation.navigate("PerfilCuidador"),
        });
      }
      if (perfilCuid.disponivel_busca === 0) {
        lembretes.push({
          key: "disponivel",
          icon: "eye-off-outline",
          titulo: "Você está oculto na busca",
          texto: "Ative a disponibilidade para receber contatos.",
          onPress: () => navigation.navigate("PerfilCuidador"),
        });
      }
    }
  }

  const lembretesVisiveis = lembretes.slice(0, 2);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: cores.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[cores.primary]} tintColor={cores.primary} />
        }
      >
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
                  Olá, {user?.nome?.split(" ")[0] || "usuário"}
                </Text>
                <Text
                  style={[
                    styles.welcomeSubtitle,
                    { color: cores.muted, fontSize: tf(14) },
                  ]}
                >
                  {user?.tipo === "cuidador"
                    ? "Seus pacientes hoje"
                    : "Resumo do cuidado de hoje"}
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

            {/* Lembretes de dados pendentes (familiar) */}
            {lembretesVisiveis.map((l) => (
              <TouchableOpacity
                key={l.key}
                style={[styles.lembrete, { backgroundColor: cores.primary + "12", borderColor: cores.primary + "40" }]}
                onPress={l.onPress}
              >
                <Ionicons name={l.icon} size={24} color={cores.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lembreteTitulo, { color: cores.primary, fontSize: tf(14) }]} numberOfLines={1}>
                    {l.titulo}
                  </Text>
                  <Text style={[styles.lembreteTexto, { color: cores.muted, fontSize: tf(12) }]} numberOfLines={2}>
                    {l.texto}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={cores.primary} />
              </TouchableOpacity>
            ))}

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
                    {calcularIdade(pacienteAtivo.data_nascimento, pacienteAtivo.idade)}
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
                    {user?.tipo !== "cuidador" && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: cores.primary }]}
                        onPress={() => navigation.navigate("CadastrarPaciente")}
                      >
                        <Ionicons name="add-outline" size={16} color="#fff" />
                        <Text style={styles.actionBtnText}>Cadastrar</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: cores.accent }]}
                      onPress={() =>
                        user?.tipo === "cuidador"
                          ? navigation.navigate("MeusPacientes", { abrirCodigo: true })
                          : navigation.navigate("VincularCuidador")
                      }
                    >
                      <Ionicons name="link-outline" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>
                        {user?.tipo === "cuidador" ? "Vincular paciente" : "Vincular"}
                      </Text>
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

            {/* Slider de artigos */}
            {artigos.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: cores.primary, fontSize: tf(18) }]}>
                  Artigos e Dicas
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 14 }}
                  contentContainerStyle={{ paddingRight: 8 }}
                >
                  {artigos.map((a: any) => (
                    <TouchableOpacity
                      key={a.artigo_id}
                      style={[styles.artigoCard, { backgroundColor: cores.card, borderColor: cores.border }]}
                      onPress={() => navigation.navigate("Artigo", { artigo_id: a.artigo_id })}
                    >
                      {a.categoria ? (
                        <View style={[styles.artigoChip, { backgroundColor: cores.primary }]}>
                          <Text style={{ color: "#fff", fontSize: tf(10), fontWeight: "700" }}>
                            {a.categoria}
                          </Text>
                        </View>
                      ) : null}
                      <Text
                        style={[styles.artigoTitulo, { color: cores.text, fontSize: tf(13) }]}
                        numberOfLines={3}
                      >
                        {a.titulo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Acesso rapido */}
            <Text style={[styles.sectionTitle, { color: cores.primary, fontSize: tf(18) }]}>
              Acesso rapido
            </Text>

            <View style={styles.quickGrid}>
              {([
                { name: "Tarefas", icon: "checkbox-outline", screen: "Tarefas" },
                { name: "Medicamentos", icon: "medical-outline", screen: "Medicamentos" },
                { name: "Diario", icon: "book-outline", screen: "Diario" },
                ...(user?.tipo === "cuidador"
                  ? [{ name: "Vincular paciente", icon: "link-outline", screen: "MeusPacientes", params: { abrirCodigo: true } }]
                  : [{ name: "Dicas", icon: "bulb-outline", screen: "Dicas" }]),
              ] as { name: string; icon: any; screen: string; params?: any }[]).map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.quickCard, { backgroundColor: cores.card, borderColor: cores.border }]}
                  onPress={() => navigation.navigate(item.screen, item.params)}
                >
                  <Ionicons name={item.icon} size={28} color={cores.primary} />
                  <Text style={[styles.quickText, { color: cores.text, fontSize: tf(13) }]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botoes vincular/cadastrar (familiar) — o cuidador acessa "Vincular paciente" pela grade acima */}
            {pacienteAtivo && user?.tipo !== "cuidador" && (
              <View style={styles.linkRow}>
                <TouchableOpacity
                  style={[styles.linkBtn, { backgroundColor: cores.card, borderColor: cores.border }]}
                  onPress={() => navigation.navigate("CadastrarPaciente")}
                >
                  <Ionicons name="add-circle-outline" size={20} color={cores.primary} />
                  <Text style={[styles.linkBtnText, { color: cores.text, fontSize: tf(13) }]} numberOfLines={2}>
                    Cadastrar {termo.toLowerCase()}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.linkBtn, { backgroundColor: cores.card, borderColor: cores.border }]}
                  onPress={() => navigation.navigate("VincularCuidador")}
                >
                  <Ionicons name="link-outline" size={20} color={cores.primary} />
                  <Text style={[styles.linkBtnText, { color: cores.text, fontSize: tf(13) }]} numberOfLines={2}>
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
  lembrete: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  lembreteTitulo: { fontWeight: "700" },
  lembreteTexto: { marginTop: 2 },
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
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  summaryLabel: { fontWeight: "600" },
  summaryVal: { flex: 1, textAlign: "center", fontWeight: "700" },
  membroRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  sectionTitle: { fontWeight: "700", marginBottom: 10, marginTop: 4 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  quickCard: {
    width: "47.5%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 8,
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 1,
  },
  quickText: { marginTop: 6, fontWeight: "600", textAlign: "center" },
  artigoCard: {
    width: 150,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    elevation: 1,
    justifyContent: "space-between",
    minHeight: 100,
  },
  artigoChip: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  artigoTitulo: { fontWeight: "600", lineHeight: 18 },
  linkRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  linkBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  linkBtnText: { fontWeight: "600", flexShrink: 1, textAlign: "center" },
});
