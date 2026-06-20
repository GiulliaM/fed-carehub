import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Text } from "../../components/Text";
import { AnimatedPressable as TouchableOpacity } from "../../components/AnimatedPressable";
import { useTema } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import api from "../../config/api";
import { normalizarFotoUrl } from "../../utils/autenticacao";
import { validarCPF } from "../../ferramentas/mascaras";

// linha de verificacao automatica (apoio pro admin decidir)
function VerifRow({ ok, label, detalhe, cores }: { ok: boolean; label: string; detalhe: string; cores: Record<string, string> }) {
  return (
    <View style={styles.verifRow}>
      <Ionicons
        name={ok ? "checkmark-circle" : "alert-circle"}
        size={18}
        color={ok ? cores.success : cores.danger}
      />
      <Text style={[styles.verifLabel, { color: cores.text }]}>{label}</Text>
      <Text style={[styles.verifDetalhe, { color: ok ? cores.success : cores.danger }]}>{detalhe}</Text>
    </View>
  );
}

type Perfil = {
  usuario_id: number;
  nome: string;
  email: string;
  bio: string | null;
  especialidades: string[];
  preco_hora: number | null;
  cidade: string | null;
  bairro: string | null;
  telefone: string | null;
  cpf: string | null;
  status: "pendente" | "aprovado" | "rejeitado";
  motivo_rejeicao: string | null;
  foto_url: string | null;
  created_at: string;
};

function InfoRow({ icone, label, valor, cores }: { icone: any; label: string; valor: string; cores: Record<string, string> }) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icone} size={16} color={cores.muted} style={{ width: 22 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: cores.muted }]}>{label}</Text>
        <Text style={[styles.infoValor, { color: cores.text }]}>{valor}</Text>
      </View>
    </View>
  );
}

export default function AdminDetalhesCuidador({ route, navigation }: any) {
  const { usuarioId } = route.params;
  const { cores } = useTema();
  const { showToast } = useToast();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalRejeitar, setModalRejeitar] = useState(false);
  const [motivo, setMotivo] = useState("");

  const carregar = useCallback(async () => {
    try {
      const res = await api.get(`/admin/cuidadores/${usuarioId}`);
      setPerfil(res.data);
    } catch {
      showToast("Erro ao carregar perfil.", "error");
      navigation.goBack();
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const aprovar = async () => {
    Alert.alert("Aprovar perfil", `Confirma a aprovação de ${perfil?.nome}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Aprovar",
        onPress: async () => {
          setSalvando(true);
          try {
            await api.patch(`/admin/cuidadores/${usuarioId}/status`, { status: "aprovado" });
            showToast("Perfil aprovado com sucesso!", "success");
            navigation.goBack();
          } catch {
            showToast("Erro ao aprovar perfil.", "error");
          } finally {
            setSalvando(false);
          }
        },
      },
    ]);
  };

  const rejeitar = async () => {
    if (!motivo.trim()) {
      showToast("Informe o motivo da rejeição.", "warning");
      return;
    }
    setSalvando(true);
    try {
      await api.patch(`/admin/cuidadores/${usuarioId}/status`, {
        status: "rejeitado",
        motivo: motivo.trim(),
      });
      showToast("Perfil rejeitado.", "info");
      setModalRejeitar(false);
      navigation.goBack();
    } catch {
      showToast("Erro ao rejeitar perfil.", "error");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={cores.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!perfil) return null;

  const foto = normalizarFotoUrl(perfil.foto_url);
  const jaDecidido = perfil.status !== "pendente";

  // verificacoes automaticas dos dados (formato/preenchimento)
  const telDigitos = (perfil.telefone || "").replace(/\D/g, "");
  const checks = {
    cpf: !!perfil.cpf && validarCPF(perfil.cpf),
    cpfDetalhe: !perfil.cpf ? "não informado" : validarCPF(perfil.cpf) ? "válido" : "inválido",
    telefone: telDigitos.length >= 10,
    foto: !!perfil.foto_url,
    local: !!perfil.cidade,
    bio: !!(perfil.bio && perfil.bio.trim()),
    especialidades: Array.isArray(perfil.especialidades) && perfil.especialidades.length > 0,
  };
  const tudoOk = checks.cpf && checks.telefone && checks.foto && checks.local && checks.bio && checks.especialidades;

  const badgeCor = perfil.status === "aprovado" ? cores.success : perfil.status === "rejeitado" ? cores.danger : cores.warning;
  const badgeLabel = perfil.status === "aprovado" ? "Aprovado" : perfil.status === "rejeitado" ? "Rejeitado" : "Pendente";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      <View style={[styles.headerNav, { borderBottomColor: cores.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={cores.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: cores.primary }]}>Revisar Perfil</Text>
        <View style={[styles.statusBadge, { backgroundColor: badgeCor }]}>
          <Text style={styles.statusBadgeText}>{badgeLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          {foto ? (
            <Image source={{ uri: foto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: cores.primary }]}>
              <Ionicons name="person" size={48} color="#fff" />
            </View>
          )}
          <Text style={[styles.nome, { color: cores.text }]}>{perfil.nome}</Text>
          <Text style={[styles.email, { color: cores.muted }]}>{perfil.email}</Text>
          <Text style={[styles.dataCadastro, { color: cores.muted }]}>
            Cadastrado em {new Date(perfil.created_at).toLocaleDateString("pt-BR")}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: cores.card, borderColor: cores.border }]}>
          <Text style={[styles.secao, { color: cores.primary }]}>Dados de Contato</Text>
          {perfil.cpf && <InfoRow icone="credit-card" label="CPF" valor={perfil.cpf} cores={cores} />}
          {perfil.telefone && <InfoRow icone="phone" label="Telefone" valor={perfil.telefone} cores={cores} />}
          {perfil.cidade && <InfoRow icone="map-pin" label="Localização" valor={[perfil.bairro, perfil.cidade].filter(Boolean).join(", ")} cores={cores} />}
          {perfil.preco_hora != null && (
            <InfoRow icone="dollar-sign" label="Valor/hora" valor={`R$ ${Number(perfil.preco_hora).toFixed(2)}`} cores={cores} />
          )}
        </View>

        {perfil.bio && (
          <View style={[styles.card, { backgroundColor: cores.card, borderColor: cores.border }]}>
            <Text style={[styles.secao, { color: cores.primary }]}>Sobre</Text>
            <Text style={[styles.bio, { color: cores.text }]}>{perfil.bio}</Text>
          </View>
        )}

        {Array.isArray(perfil.especialidades) && perfil.especialidades.length > 0 && (
          <View style={[styles.card, { backgroundColor: cores.card, borderColor: cores.border }]}>
            <Text style={[styles.secao, { color: cores.primary }]}>Especialidades</Text>
            <View style={styles.tagsRow}>
              {perfil.especialidades.map((e) => (
                <View key={e} style={[styles.tag, { backgroundColor: cores.primary + "18" }]}>
                  <Text style={[styles.tagText, { color: cores.primary }]}>{e}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: cores.card, borderColor: tudoOk ? cores.success : cores.warning }]}>
          <View style={styles.verifHeader}>
            <Text style={[styles.secao, { color: cores.primary, marginBottom: 0 }]}>Verificação dos dados</Text>
            <View style={[styles.verifTag, { backgroundColor: (tudoOk ? cores.success : cores.warning) + "22" }]}>
              <Text style={[styles.verifTagTxt, { color: tudoOk ? cores.success : cores.warning }]}>
                {tudoOk ? "Completo" : "Revisar"}
              </Text>
            </View>
          </View>
          <VerifRow ok={checks.cpf} label="CPF" detalhe={checks.cpfDetalhe} cores={cores} />
          <VerifRow ok={checks.telefone} label="Telefone" detalhe={checks.telefone ? "completo" : "incompleto"} cores={cores} />
          <VerifRow ok={checks.local} label="Localização" detalhe={checks.local ? "informada" : "ausente"} cores={cores} />
          <VerifRow ok={checks.foto} label="Foto de perfil" detalhe={checks.foto ? "enviada" : "ausente"} cores={cores} />
          <VerifRow ok={checks.bio} label="Apresentação" detalhe={checks.bio ? "preenchida" : "ausente"} cores={cores} />
          <VerifRow ok={checks.especialidades} label="Especialidades" detalhe={checks.especialidades ? "informadas" : "ausente"} cores={cores} />
          <Text style={[styles.verifNota, { color: cores.muted }]}>
            Conferência de formato e preenchimento dos dados informados.
          </Text>
        </View>

        {perfil.status === "rejeitado" && perfil.motivo_rejeicao && (
          <View style={[styles.card, { backgroundColor: cores.danger + "15", borderColor: cores.danger }]}>
            <Text style={[styles.secao, { color: cores.danger }]}>Motivo da Rejeição</Text>
            <Text style={[styles.bio, { color: cores.text }]}>{perfil.motivo_rejeicao}</Text>
          </View>
        )}

        {!jaDecidido && (
          <View style={styles.acoes}>
            <TouchableOpacity
              style={[styles.btnAprovar, { backgroundColor: cores.success }]}
              onPress={aprovar}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="check" size={20} color="#fff" />
                  <Text style={styles.btnText}>Aprovar</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnRejeitar, { backgroundColor: cores.danger }]}
              onPress={() => setModalRejeitar(true)}
              disabled={salvando}
            >
              <Feather name="x" size={20} color="#fff" />
              <Text style={styles.btnText}>Rejeitar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalRejeitar}
        transparent
        animationType="slide"
        onRequestClose={() => setModalRejeitar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: cores.card }]}>
            <Text style={[styles.modalTitulo, { color: cores.text }]}>Motivo da Rejeição</Text>
            <Text style={[styles.modalSub, { color: cores.muted }]}>
              Descreva o motivo para que o cuidador possa corrigir o perfil.
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: cores.inputBg, color: cores.text, borderColor: cores.border }]}
              placeholder="Ex: Informações incompletas, foto inválida..."
              placeholderTextColor={cores.muted}
              value={motivo}
              onChangeText={setMotivo}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalAcoes}>
              <TouchableOpacity
                style={[styles.modalBtnCancelar, { borderColor: cores.border }]}
                onPress={() => { setModalRejeitar(false); setMotivo(""); }}
              >
                <Text style={[{ color: cores.muted, fontWeight: "600" }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirmar, { backgroundColor: cores.danger }]}
                onPress={rejeitar}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  verifHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  verifTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  verifTagTxt: { fontSize: 11, fontWeight: "700" },
  verifRow: { flexDirection: "row", alignItems: "center", paddingVertical: 5, gap: 8 },
  verifLabel: { flex: 1, fontSize: 14 },
  verifDetalhe: { fontSize: 13, fontWeight: "600" },
  verifNota: { fontSize: 11, marginTop: 8, fontStyle: "italic" },
  content: { padding: 16, gap: 12 },
  avatarSection: { alignItems: "center", paddingVertical: 16 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  nome: { fontSize: 20, fontWeight: "700" },
  email: { fontSize: 14, marginTop: 2 },
  dataCadastro: { fontSize: 12, marginTop: 4 },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  secao: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  infoLabel: { fontSize: 11 },
  infoValor: { fontSize: 14, fontWeight: "500" },
  bio: { fontSize: 14, lineHeight: 21 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 12 },
  acoes: { flexDirection: "row", gap: 12, marginTop: 8, marginBottom: 24 },
  btnAprovar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnRejeitar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitulo: { fontSize: 18, fontWeight: "700" },
  modalSub: { fontSize: 14, lineHeight: 20 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
  },
  modalAcoes: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBtnCancelar: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalBtnConfirmar: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
});
