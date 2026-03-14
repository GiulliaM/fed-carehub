import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utils/clienteApi";

type ContatoEmergencia = { nome: string; parentesco: string; telefone: string };

function formatarData(d: string | null): string {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

export default function HistoricoMedico({ route, navigation }: any) {
  const { cores } = useTema();
  const [paciente, setPaciente] = useState<any>(route.params?.paciente || null);
  const [carregando, setCarregando] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(false);

  const [condicoesCronicas, setCondicoesCronicas] = useState("");
  const [alergias, setAlergias] = useState("");
  const [historicoCirurgico, setHistoricoCirurgico] = useState("");
  const [tipoSanguineo, setTipoSanguineo] = useState("");
  const [planoSaudeNome, setPlanoSaudeNome] = useState("");
  const [planoSaudeNumero, setPlanoSaudeNumero] = useState("");
  const [contatosEmergencia, setContatosEmergencia] = useState<ContatoEmergencia[]>([]);
  const [medicoResponsavel, setMedicoResponsavel] = useState("");
  const [telefoneMedico, setTelefoneMedico] = useState("");
  const [capacidadeFuncional, setCapacidadeFuncional] = useState("");
  const [observacoesGerais, setObservacoesGerais] = useState("");

  const [ultimaAlteracaoNome, setUltimaAlteracaoNome] = useState<string | null>(null);
  const [ultimaAlteracaoEm, setUltimaAlteracaoEm] = useState<string | null>(null);

  const carregarPaciente = useCallback(async () => {
    let p = route.params?.paciente;
    if (!p) {
      const raw = await AsyncStorage.getItem("paciente");
      p = raw ? JSON.parse(raw) : null;
    }
    setPaciente(p);
    return p;
  }, [route.params?.paciente]);

  const carregarHistorico = useCallback(async () => {
    const p = await carregarPaciente();
    if (!p?.paciente_id) {
      setCarregando(false);
      return;
    }
    try {
      setCarregando(true);
      const res = await api.get(`/pacientes/${p.paciente_id}/historico-medico`);
      const h = res || {};
      setCondicoesCronicas(h.condicoes_cronicas || "");
      setAlergias(h.alergias || "");
      setHistoricoCirurgico(h.historico_cirurgico || "");
      setTipoSanguineo(h.tipo_sanguineo || "");
      setPlanoSaudeNome(h.plano_saude_nome || "");
      setPlanoSaudeNumero(h.plano_saude_numero || "");
      setMedicoResponsavel(h.medico_responsavel || "");
      setTelefoneMedico(h.telefone_medico || "");
      setCapacidadeFuncional(h.capacidade_funcional || "");
      setObservacoesGerais(h.observacoes_gerais || "");
      const contatos = Array.isArray(h.contatos_emergencia) ? h.contatos_emergencia : [];
      setContatosEmergencia(
        contatos.length > 0
          ? contatos.map((c: any) => ({
              nome: c.nome || "",
              parentesco: c.parentesco || "",
              telefone: c.telefone || "",
            }))
          : [{ nome: "", parentesco: "", telefone: "" }]
      );
      setUltimaAlteracaoNome(h.ultima_alteracao_nome || null);
      setUltimaAlteracaoEm(h.ultima_alteracao_em || null);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        Alert.alert("Acesso negado", "Você não tem permissão para ver este histórico.");
        navigation.goBack();
        return;
      }
      Alert.alert("Erro", "Não foi possível carregar o histórico médico.");
    } finally {
      setCarregando(false);
    }
  }, [carregarPaciente, navigation]);

  useFocusEffect(
    useCallback(() => {
      carregarHistorico();
    }, [carregarHistorico])
  );

  const adicionarContato = () => {
    setContatosEmergencia([...contatosEmergencia, { nome: "", parentesco: "", telefone: "" }]);
  };

  const removerContato = (index: number) => {
    setContatosEmergencia(contatosEmergencia.filter((_, i) => i !== index));
  };

  const atualizarContato = (index: number, field: keyof ContatoEmergencia, value: string) => {
    const next = [...contatosEmergencia];
    next[index] = { ...next[index], [field]: value };
    setContatosEmergencia(next);
  };

  const salvar = async () => {
    if (!paciente?.paciente_id) return;
    const contatosParaEnviar = contatosEmergencia.filter(
      (c) => c.nome.trim() || c.telefone.trim()
    );
    try {
      setSaving(true);
      await api.patch(`/pacientes/${paciente.paciente_id}/historico-medico`, {
        condicoes_cronicas: condicoesCronicas.trim() || null,
        alergias: alergias.trim() || null,
        historico_cirurgico: historicoCirurgico.trim() || null,
        tipo_sanguineo: tipoSanguineo.trim() || null,
        plano_saude_nome: planoSaudeNome.trim() || null,
        plano_saude_numero: planoSaudeNumero.trim() || null,
        contatos_emergencia: contatosParaEnviar.length ? contatosParaEnviar : [],
        medico_responsavel: medicoResponsavel.trim() || null,
        telefone_medico: telefoneMedico.trim() || null,
        capacidade_funcional: capacidadeFuncional.trim() || null,
        observacoes_gerais: observacoesGerais.trim() || null,
      });
      setEditando(false);
      carregarHistorico();
      Alert.alert("Sucesso", "Histórico médico atualizado.");
    } catch (err: any) {
      if (err?.response?.status === 403) {
        Alert.alert("Acesso negado", "Você não tem permissão para editar.");
        return;
      }
      Alert.alert("Erro", err?.response?.data?.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (carregando && !paciente) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={cores.primary} />
          <Text style={[styles.carregandoText, { color: cores.text }]}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!paciente?.paciente_id) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={cores.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: cores.primary }]}>Histórico médico</Text>
        </View>
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: cores.muted }]}>
            Nenhum paciente selecionado.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const bloco = (label: string, value: string, multiline = false) => (
    <View style={styles.bloco}>
      <Text style={[styles.label, { color: cores.text }]}>{label}</Text>
      <Text style={[styles.value, { color: cores.text }]}>{value || "—"}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={cores.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: cores.primary }]} numberOfLines={1}>
            Histórico médico — {paciente.nome}
          </Text>
        </View>

        {(ultimaAlteracaoNome || ultimaAlteracaoEm) && (
          <View style={[styles.auditoria, { backgroundColor: cores.card }]}>
            <Ionicons name="information-circle-outline" size={20} color={cores.primary} />
            <Text style={[styles.auditoriaText, { color: cores.muted }]}>
              Última alteração por <Text style={styles.auditoriaDestaque}>{ultimaAlteracaoNome || "—"}</Text>
              {ultimaAlteracaoEm ? ` em ${formatarData(ultimaAlteracaoEm)}` : ""}
            </Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!editando ? (
            <>
              {bloco("Condições crônicas", condicoesCronicas, true)}
              {bloco("Alergias (medicamentos, alimentos, etc.)", alergias, true)}
              {bloco("Histórico cirúrgico", historicoCirurgico, true)}
              {bloco("Tipo sanguíneo", tipoSanguineo)}
              {bloco("Plano de saúde (nome)", planoSaudeNome)}
              {bloco("Número da carteirinha", planoSaudeNumero)}
              {bloco("Médico responsável", medicoResponsavel)}
              {bloco("Telefone do médico", telefoneMedico)}
              {bloco("Capacidade funcional (ADLs)", capacidadeFuncional, true)}
              {bloco("Observações gerais", observacoesGerais, true)}
              {contatosEmergencia.filter((c) => c.nome || c.telefone).length > 0 && (
                <View style={styles.bloco}>
                  <Text style={[styles.label, { color: cores.text }]}>Contatos de emergência</Text>
                  {contatosEmergencia
                    .filter((c) => c.nome || c.telefone)
                    .map((c, i) => (
                      <Text key={i} style={[styles.value, { color: cores.text, marginTop: 4 }]}>
                        {c.nome} {c.parentesco ? `(${c.parentesco})` : ""} — {c.telefone}
                      </Text>
                    ))}
                </View>
              )}
              <TouchableOpacity
                style={[styles.btnEdit, { backgroundColor: cores.primary }]}
                onPress={() => setEditando(true)}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.btnEditText}>Editar histórico</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Campo label="Condições crônicas" value={condicoesCronicas} onChange={setCondicoesCronicas} cores={cores} multiline />
              <Campo label="Alergias (medicamentos, alimentos, látex)" value={alergias} onChange={setAlergias} cores={cores} multiline />
              <Campo label="Histórico cirúrgico" value={historicoCirurgico} onChange={setHistoricoCirurgico} cores={cores} multiline />
              <Campo label="Tipo sanguíneo" value={tipoSanguineo} onChange={setTipoSanguineo} cores={cores} placeholder="Ex: A+" />
              <Campo label="Plano de saúde (nome)" value={planoSaudeNome} onChange={setPlanoSaudeNome} cores={cores} />
              <Campo label="Número da carteirinha" value={planoSaudeNumero} onChange={setPlanoSaudeNumero} cores={cores} />
              <Campo label="Médico responsável" value={medicoResponsavel} onChange={setMedicoResponsavel} cores={cores} />
              <Campo label="Telefone do médico" value={telefoneMedico} onChange={setTelefoneMedico} cores={cores} />
              <Campo label="Capacidade funcional (ADLs)" value={capacidadeFuncional} onChange={setCapacidadeFuncional} cores={cores} multiline />
              <Campo label="Observações gerais" value={observacoesGerais} onChange={setObservacoesGerais} cores={cores} multiline />

              <Text style={[styles.label, { color: cores.text, marginTop: 16 }]}>Contatos de emergência</Text>
              {contatosEmergencia.map((c, i) => (
                <View key={i} style={[styles.contatoCard, { backgroundColor: cores.card }]}>
                  <TextInput
                    style={[styles.input, { color: cores.text, borderColor: cores.muted }]}
                    placeholder="Nome"
                    placeholderTextColor={cores.muted}
                    value={c.nome}
                    onChangeText={(v) => atualizarContato(i, "nome", v)}
                  />
                  <TextInput
                    style={[styles.input, styles.inputSmall, { color: cores.text, borderColor: cores.muted }]}
                    placeholder="Parentesco (ex: Filho, Cônjuge)"
                    placeholderTextColor={cores.muted}
                    value={c.parentesco}
                    onChangeText={(v) => atualizarContato(i, "parentesco", v)}
                  />
                  <TextInput
                    style={[styles.input, styles.inputSmall, { color: cores.text, borderColor: cores.muted }]}
                    placeholder="Telefone"
                    placeholderTextColor={cores.muted}
                    value={c.telefone}
                    onChangeText={(v) => atualizarContato(i, "telefone", v)}
                    keyboardType="phone-pad"
                  />
                  <TouchableOpacity onPress={() => removerContato(i)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={22} color={cores.muted} />
                    <Text style={[styles.removeBtnText, { color: cores.muted }]}>Remover</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={adicionarContato} style={styles.addContatoBtn}>
                <Ionicons name="add-circle-outline" size={22} color={cores.primary} />
                <Text style={[styles.addContatoText, { color: cores.primary }]}>Adicionar contato</Text>
              </TouchableOpacity>

              <View style={styles.botoesEdit}>
                <TouchableOpacity
                  style={[styles.btnCancel, { borderColor: cores.muted }]}
                  onPress={() => setEditando(false)}
                >
                  <Text style={[styles.btnCancelText, { color: cores.muted }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSalvar, { backgroundColor: cores.primary }]}
                  onPress={salvar}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.btnSalvarText}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Campo({
  label,
  value,
  onChange,
  cores,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  cores: Record<string, string>;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={styles.campo}>
      <Text style={[styles.label, { color: cores.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { color: cores.text, borderColor: cores.muted },
          multiline && styles.inputMultiline,
        ]}
        placeholder={placeholder || label}
        placeholderTextColor={cores.muted}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  carregandoText: { marginTop: 10 },
  emptyText: { textAlign: "center", fontSize: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: { marginRight: 12, padding: 4 },
  title: { fontSize: 18, fontWeight: "700", flex: 1 },
  auditoria: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
  },
  auditoriaText: { fontSize: 13, flex: 1 },
  auditoriaDestaque: { fontWeight: "700", color: "#333" },
  scroll: { padding: 16, paddingBottom: 40 },
  bloco: { marginBottom: 16 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  value: { fontSize: 15 },
  campo: { marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  contatoCard: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  inputSmall: { marginTop: 8 },
  removeBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, padding: 4 },
  removeBtnText: { fontSize: 14 },
  addContatoBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  addContatoText: { fontSize: 15, fontWeight: "600" },
  btnEdit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  btnEditText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  botoesEdit: { flexDirection: "row", gap: 12, marginTop: 20 },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  btnCancelText: { fontWeight: "600" },
  btnSalvar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnSalvarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
