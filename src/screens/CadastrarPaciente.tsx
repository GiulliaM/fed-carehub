import React, { useState } from "react";
import {
TextInput,
StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View
} from "react-native";
import { Text } from "../components/Text";
import { AnimatedPressable as TouchableOpacity } from "../components/AnimatedPressable";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../config/api";
import { mascaraTelefone } from "../ferramentas/mascaras";

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
    icon: "brain-outline" as any,
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

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CadastrarPaciente({ route, navigation }: any) {
  const { cores, tf } = useTema();
  const primeiroAcesso = route.params?.primeiroAcesso ?? false;

  const mascaraData = (t: string) => {
    const n = t.replace(/\D/g, "").substring(0, 8);
    if (n.length <= 2) return n;
    if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
    return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
  };

  const formatarDataAPI = (s: string): string | null => {
    const parts = s.split("/");
    if (parts.length === 3 && parts[2].length === 4)
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return s || null;
  };

  // Bloco 1 — Identificação
  const [nome, setNome] = useState("");
  const [genero, setGenero] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [responsavelLegal, setResponsavelLegal] = useState("");
  const [telefoneContato, setTelefoneContato] = useState("");

  // Bloco 2 — Categorias de cuidado
  const [categorias, setCategorias] = useState<string[]>([]);
  const [expandedCat, setExpandedCat] = useState<string | null>("fisicas");

  // Bloco 3 — Observações
  const [restricoes, setRestricoes] = useState("");
  const [observacoesRotina, setObservacoesRotina] = useState("");

  const toggleCategoria = (value: string) => {
    setCategorias((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const cadastrar = async () => {
    if (!nome.trim()) return Alert.alert("Atenção", "Informe o nome do paciente.");

    try {
      const res = await api.post("/pacientes", {
        nome: nome.trim(),
        genero: genero.trim() || null,
        data_nascimento: formatarDataAPI(dataNascimento),
        responsavel_legal: responsavelLegal.trim() || null,
        telefone_contato: telefoneContato.trim() || null,
        categorias_cuidado: categorias.length > 0 ? categorias : null,
        restricoes_alimentares: restricoes.trim() || null,
        observacoes_rotina: observacoesRotina.trim() || null,
      });

      const { paciente_id } = res.data;
      const pacienteObj = {
        paciente_id,
        nome: nome.trim(),
        genero: genero.trim() || null,
        data_nascimento: formatarDataAPI(dataNascimento),
        responsavel_legal: responsavelLegal.trim() || null,
        telefone_contato: telefoneContato.trim() || null,
        categorias_cuidado: categorias,
        restricoes_alimentares: restricoes.trim() || null,
        observacoes_rotina: observacoesRotina.trim() || null,
      };

      await AsyncStorage.multiSet([
        ["paciente", JSON.stringify(pacienteObj)],
        ["paciente_ativo_id", String(paciente_id)],
      ]);

      Alert.alert("Sucesso", "Paciente cadastrado com sucesso!");
      navigation.reset({ index: 0, routes: [{ name: "Abas" }] });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Falha ao conectar com o servidor.";
      Alert.alert("Erro", msg);
    }
  };

  // ─── Renderização ────────────────────────────────────────────────────────────

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
          {primeiroAcesso && (
            <Text style={[styles.boasVindas, { color: cores.muted, fontSize: tf(14) }]}>
              Bem-vindo(a) ao CareHub! Cadastre agora a pessoa que você vai cuidar.
            </Text>
          )}

          <Text style={[styles.title, { color: cores.primary, fontSize: tf(22) }]}>
            Cadastrar Paciente
          </Text>

          {/* ── Bloco 1: Identificação ─────────────────────────────── */}
          <SectionCard icon="person-outline" label="Identificação" cores={cores} tf={tf}>
            <TextInput
              style={[styles.input, { backgroundColor: cores.inputBg, color: cores.inputText, borderColor: cores.border }]}
              placeholder="Nome completo *"
              placeholderTextColor={cores.inputPlaceholder}
              value={nome}
              onChangeText={setNome}
            />
            <Text style={[styles.fieldLabelInline, { color: cores.text, fontSize: tf(14) }]}>Gênero</Text>
            <View style={[styles.generoRow, { borderColor: cores.border }]}>
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
              onChangeText={(t) => setTelefoneContato(mascaraTelefone(t))}
              keyboardType="phone-pad"
            />
          </SectionCard>

          {/* ── Bloco 2: Categorias de cuidado ────────────────────── */}
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
                    style={[styles.catHeader, { backgroundColor: cores.card, borderColor: cores.border }]}
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
                    <View style={[styles.catBody, { backgroundColor: cores.card, borderColor: cores.border }]}>
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

          {/* ── Bloco 3: Observações ───────────────────────────────── */}
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

          {/* ── Botão salvar ───────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.btnSalvar, { backgroundColor: cores.primary }]}
            onPress={cadastrar}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={[styles.btnSalvarText, { fontSize: tf(16) }]}>Salvar Paciente</Text>
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
  container: { padding: 16, paddingBottom: 40 },
  boasVindas: { textAlign: "center", marginBottom: 12, lineHeight: 22 },
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
  fieldLabelInline: { fontWeight: "600", marginBottom: 6 },
  generoRow: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 12,
  },
  generoBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 0,
  },
  generoBtnText: { fontWeight: "700", fontSize: 13 },
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
});
