import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import api from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Catálogo de categorias de cuidado ───────────────────────────────────────

const CATEGORIAS_CUIDADO = [
  {
    key: "fisicas",
    label: "Físicas e Motoras",
    icon: "body-outline",
    itens: [
      { value: "independente", label: "Independente" },
      { value: "mobilidade_reduzida", label: "Mobilidade reduzida" },
      { value: "cadeirante", label: "Cadeirante" },
      { value: "acamado", label: "Acamado" },
      { value: "risco_queda", label: "Risco de queda" },
      { value: "mudanca_decubito", label: "Mudança de decúbito" },
    ],
  },
  {
    key: "cognitivas",
    label: "Cognitivas e Mentais",
    icon: "bulb-outline",
    itens: [
      { value: "lucido_orientado", label: "Lúcido e orientado" },
      { value: "alzheimer_demencia", label: "Alzheimer / Demência" },
      { value: "confusao_mental", label: "Confusão mental" },
      { value: "agitacao_agressividade", label: "Agitação / Agressividade" },
      { value: "depressao_apatia", label: "Depressão / Apatia" },
      { value: "parkinson", label: "Parkinson" },
    ],
  },
  {
    key: "sensoriais",
    label: "Sensoriais",
    icon: "ear-outline",
    itens: [
      { value: "def_visual", label: "Deficiência visual" },
      { value: "def_auditiva", label: "Deficiência auditiva" },
      { value: "afasia", label: "Afasia (dif. de fala)" },
      { value: "disfagia", label: "Disfagia (engasgo)" },
    ],
  },
  {
    key: "dependencias",
    label: "Dependências e Suporte",
    icon: "medkit-outline",
    itens: [
      { value: "uso_fraldas", label: "Uso de fraldas" },
      { value: "sonda_alimentar", label: "Sonda alimentar" },
      { value: "sonda_vesical", label: "Sonda vesical" },
      { value: "oxigenoterapia", label: "Oxigenoterapia" },
      { value: "glicemia_insulina", label: "Glicemia / Insulina" },
      { value: "curativos_complexos", label: "Curativos complexos" },
    ],
  },
];

// ─── Helpers de data ────────────────────────────────────────────────────────
function isoParaDDMMAAAA(iso: string): string {
  const s = iso.split("T")[0]; // "AAAA-MM-DD"
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

function ddmmAAAAParaIso(ddmmaaaa: string): string {
  const [d, m, y] = ddmmaaaa.split("/");
  if (!d || !m || !y) return ddmmaaaa;
  return `${y}-${m}-${d}`;
}

function mascaraData(raw: string): string {
  const nums = raw.replace(/\D/g, "").slice(0, 8);
  if (nums.length <= 2) return nums;
  if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`;
  return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4)}`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function EditarPaciente({ route, navigation }: any) {
  const { cores, tf } = useTema();
  const [paciente, setPaciente] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  // Bloco 1 — Identificação
  const [nome, setNome] = useState("");
  const [genero, setGenero] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [responsavelLegal, setResponsavelLegal] = useState("");
  const [telefoneContato, setTelefoneContato] = useState("");

  // Bloco 2 — Categorias
  const [categorias, setCategorias] = useState<string[]>([]);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // Bloco 3 — Observações
  const [restricoes, setRestricoes] = useState("");
  const [observacoesRotina, setObservacoesRotina] = useState("");

  const pacienteParam = route.params?.paciente;

  useEffect(() => {
    if (pacienteParam) {
      preencherCampos(pacienteParam);
      setCarregando(false);
    } else {
      carregarPaciente();
    }
  }, []);

  const preencherCampos = (p: any) => {
    setPaciente(p);
    setNome(p.nome || "");
    setGenero(p.genero || "");
    setDataNascimento(p.data_nascimento ? isoParaDDMMAAAA(p.data_nascimento) : "");
    setResponsavelLegal(p.responsavel_legal || "");
    setTelefoneContato(p.telefone_contato || "");
    setRestricoes(p.restricoes_alimentares || "");
    setObservacoesRotina(p.observacoes_rotina || p.observacoes || "");

    // categorias_cuidado pode vir como string JSON ou array
    let cats: string[] = [];
    if (Array.isArray(p.categorias_cuidado)) {
      cats = p.categorias_cuidado;
    } else if (typeof p.categorias_cuidado === "string") {
      try { cats = JSON.parse(p.categorias_cuidado); } catch { cats = []; }
    }
    setCategorias(cats);
  };

  const carregarPaciente = async () => {
    try {
      const res = await api.get("/pacientes");
      if (Array.isArray(res.data) && res.data.length > 0) preencherCampos(res.data[0]);
    } catch {
      Alert.alert("Erro", "Falha ao carregar dados do paciente.");
    } finally {
      setCarregando(false);
    }
  };

  const toggleCategoria = (value: string) => {
    setCategorias((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const salvarAlteracoes = async () => {
    if (!paciente?.paciente_id) return Alert.alert("Erro", "Paciente inválido.");

    try {
      await api.patch(`/pacientes/${paciente.paciente_id}`, {
        nome: nome.trim(),
        genero: genero.trim() || null,
        data_nascimento: dataNascimento.trim() ? ddmmAAAAParaIso(dataNascimento.trim()) : null,
        responsavel_legal: responsavelLegal.trim() || null,
        telefone_contato: telefoneContato.trim() || null,
        categorias_cuidado: categorias.length > 0 ? categorias : null,
        restricoes_alimentares: restricoes.trim() || null,
        observacoes_rotina: observacoesRotina.trim() || null,
      });

      const pacienteAtualizado = {
        ...paciente,
        nome: nome.trim(),
        genero: genero.trim() || null,
        data_nascimento: dataNascimento.trim() ? ddmmAAAAParaIso(dataNascimento.trim()) : null,
        responsavel_legal: responsavelLegal.trim() || null,
        telefone_contato: telefoneContato.trim() || null,
        categorias_cuidado: categorias,
        restricoes_alimentares: restricoes.trim() || null,
        observacoes_rotina: observacoesRotina.trim() || null,
      };

      await AsyncStorage.setItem("paciente", JSON.stringify(pacienteAtualizado));

      Alert.alert("Sucesso", "Informações atualizadas com sucesso!");
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Falha ao conectar com o servidor.";
      Alert.alert("Erro", msg);
    }
  };

  const confirmarExclusao = () => {
    Alert.alert(
      "Excluir paciente",
      `Tem certeza que deseja excluir "${nome}"? Esta ação não pode ser desfeita e todos os dados (tarefas, medicamentos, diário) serão removidos permanentemente.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            Alert.prompt(
              "Confirmar exclusão",
              "Digite o nome do paciente para confirmar:",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Excluir",
                  style: "destructive",
                  onPress: async (digitado?: string) => {
                    if (digitado?.trim().toLowerCase() !== nome.trim().toLowerCase()) {
                      Alert.alert("Nome incorreto", "O nome digitado não corresponde. Exclusão cancelada.");
                      return;
                    }
                    try {
                      await api.delete(`/pacientes/${paciente.paciente_id}`);
                      await AsyncStorage.multiRemove(["paciente", "paciente_ativo_id"]);
                      Alert.alert("Concluído", "Paciente excluído com sucesso.", [
                        { text: "OK", onPress: () => navigation.navigate("Abas") },
                      ]);
                    } catch (err: any) {
                      const msg = err?.response?.data?.message || "Não foi possível excluir o paciente.";
                      Alert.alert("Erro", msg);
                    }
                  },
                },
              ],
              "plain-text"
            );
          },
        },
      ]
    );
  };

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={cores.primary} />
      </View>
    );
  }

  // ─── Renderização ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: cores.primary, fontSize: tf(22) }]}>
            Editar Paciente
          </Text>

          {/* ── Bloco 1: Identificação ────────────────────────────── */}
          <SectionCard icon="person-outline" label="Identificação" cores={cores} tf={tf}>
            <TextInput
              style={[styles.input, { backgroundColor: cores.inputBg, color: cores.inputText, borderColor: cores.border }]}
              placeholder="Nome completo *"
              placeholderTextColor={cores.inputPlaceholder}
              value={nome}
              onChangeText={setNome}
            />
            <Text style={[styles.fieldLabelInline, { color: cores.text, fontSize: tf(14) }]}>Gênero</Text>
            <View style={[styles.generoRow, { borderColor: cores.primary }]}>
              {(["Feminino", "Masculino", "Outro"] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.generoBtn,
                    { borderColor: cores.primary },
                    genero === g && { backgroundColor: cores.primary },
                  ]}
                  onPress={() => setGenero(genero === g ? "" : g)}
                >
                  <Text style={[styles.generoBtnText, { color: genero === g ? "#fff" : cores.primary }]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: cores.inputBg, color: cores.inputText, borderColor: cores.border }]}
              placeholder="Data de nascimento (DD/MM/AAAA)"
              placeholderTextColor={cores.inputPlaceholder}
              value={dataNascimento}
              onChangeText={(t) => setDataNascimento(mascaraData(t))}
              keyboardType="numeric"
              maxLength={10}
            />
            <TextInput
              style={[styles.input, { backgroundColor: cores.inputBg, color: cores.inputText, borderColor: cores.border }]}
              placeholder="Responsável legal (nome)"
              placeholderTextColor={cores.inputPlaceholder}
              value={responsavelLegal}
              onChangeText={setResponsavelLegal}
            />
            <TextInput
              style={[styles.input, { backgroundColor: cores.inputBg, color: cores.inputText, borderColor: cores.border }]}
              placeholder="Telefone de contato"
              placeholderTextColor={cores.inputPlaceholder}
              value={telefoneContato}
              onChangeText={setTelefoneContato}
              keyboardType="phone-pad"
            />
          </SectionCard>

          {/* ── Bloco 2: Categorias de cuidado ───────────────────── */}
          <SectionCard icon="heart-outline" label="Categorias de Cuidado" cores={cores} tf={tf}>
            <Text style={[styles.catSubtitle, { color: cores.muted, fontSize: tf(13) }]}>
              Selecione todas que se aplicam ao paciente
            </Text>
            {CATEGORIAS_CUIDADO.map((cat) => {
              const isExpanded = expandedCat === cat.key;
              const qtdSelecionados = cat.itens.filter((i) => categorias.includes(i.value)).length;
              return (
                <View key={cat.key} style={{ marginBottom: 6 }}>
                  <TouchableOpacity
                    style={[styles.catHeader, { backgroundColor: cores.background, borderColor: cores.border }]}
                    onPress={() => setExpandedCat(isExpanded ? null : cat.key)}
                  >
                    <Ionicons name={cat.icon as any} size={20} color={cores.primary} />
                    <Text style={[styles.catLabel, { color: cores.text, fontSize: tf(14) }]}>
                      {cat.label}
                    </Text>
                    {qtdSelecionados > 0 && (
                      <View style={[styles.badge, { backgroundColor: cores.primary }]}>
                        <Text style={styles.badgeText}>{qtdSelecionados}</Text>
                      </View>
                    )}
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={cores.muted}
                      style={{ marginLeft: "auto" }}
                    />
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={[styles.catBody, { backgroundColor: cores.background, borderColor: cores.border }]}>
                      {cat.itens.map((item) => {
                        const ativo = categorias.includes(item.value);
                        return (
                          <TouchableOpacity
                            key={item.value}
                            style={[
                              styles.checkRow,
                              {
                                backgroundColor: ativo ? cores.primary + "15" : "transparent",
                                borderColor: ativo ? cores.primary : cores.border,
                              },
                            ]}
                            onPress={() => toggleCategoria(item.value)}
                          >
                            <Ionicons
                              name={ativo ? "checkbox" : "square-outline"}
                              size={20}
                              color={ativo ? cores.primary : cores.muted}
                            />
                            <Text style={[styles.checkLabel, { color: cores.text, fontSize: tf(14) }]}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </SectionCard>

          {/* ── Bloco 3: Observações ─────────────────────────────── */}
          <SectionCard icon="document-text-outline" label="Observações" cores={cores} tf={tf}>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: cores.inputBg, color: cores.inputText, borderColor: cores.border }]}
              placeholder="Restrições alimentares"
              placeholderTextColor={cores.inputPlaceholder}
              value={restricoes}
              onChangeText={setRestricoes}
              multiline
            />
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: cores.inputBg, color: cores.inputText, borderColor: cores.border }]}
              placeholder="Observações da rotina (cuidados, horários, preferências...)"
              placeholderTextColor={cores.inputPlaceholder}
              value={observacoesRotina}
              onChangeText={setObservacoesRotina}
              multiline
            />
          </SectionCard>

          {/* ── Botões ────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.btnSalvar, { backgroundColor: cores.primary }]}
            onPress={salvarAlteracoes}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={[styles.btnSalvarText, { fontSize: tf(16) }]}>Salvar Alterações</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnVoltar, { borderColor: cores.border }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.btnVoltarText, { color: cores.muted, fontSize: tf(15) }]}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnExcluir, { borderColor: cores.danger || "#e53e3e" }]}
            onPress={confirmarExclusao}
          >
            <Ionicons name="trash-outline" size={18} color={cores.danger || "#e53e3e"} />
            <Text style={[styles.btnExcluirText, { color: cores.danger || "#e53e3e", fontSize: tf(15) }]}>
              Excluir paciente
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-componente de bloco ─────────────────────────────────────────────────

function SectionCard({ icon, label, children, cores, tf }: any) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: cores.card, borderColor: cores.border }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={cores.primary} />
        <Text style={[styles.sectionLabel, { color: cores.text, fontSize: tf(15) }]}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 16, paddingBottom: 40 },
  title: { fontWeight: "700", textAlign: "center", marginBottom: 20 },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  sectionLabel: { fontWeight: "700" },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  catSubtitle: { marginBottom: 4 },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  catLabel: { fontWeight: "600" },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  catBody: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    padding: 8,
    gap: 6,
    marginTop: -4,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkLabel: { fontWeight: "500" },
  fieldLabelInline: { fontWeight: "600", marginBottom: 6 },
  generoRow: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 4,
  },
  generoBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 0,
  },
  generoBtnText: { fontWeight: "700", fontSize: 13 },
  btnSalvar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  btnSalvarText: { color: "#fff", fontWeight: "700" },
  btnVoltar: {
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  btnVoltarText: { fontWeight: "600" },
  btnExcluir: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 14,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  btnExcluirText: { fontWeight: "700" },
});
