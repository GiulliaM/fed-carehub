import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import api from "../config/api";

const CATEGORIAS_LABEL: Record<string, string> = {
  independente: "Independente",
  mobilidade_reduzida: "Mobilidade reduzida",
  cadeirante: "Cadeirante",
  acamado: "Acamado",
  risco_queda: "Risco de queda",
  mudanca_decubito: "Mudança de decúbito",
  lucido_orientado: "Lúcido e orientado",
  alzheimer_demencia: "Alzheimer / Demência",
  confusao_mental: "Confusão mental",
  agitacao_agressividade: "Agitação / Agressividade",
  depressao_apatia: "Depressão / Apatia",
  parkinson: "Parkinson",
  def_visual: "Deficiência visual",
  def_auditiva: "Deficiência auditiva",
  afasia: "Afasia (dif. de fala)",
  disfagia: "Disfagia (engasgo)",
  uso_fraldas: "Uso de fraldas",
  sonda_alimentar: "Sonda alimentar",
  sonda_vesical: "Sonda vesical",
  oxigenoterapia: "Oxigenoterapia",
  glicemia_insulina: "Glicemia / Insulina",
  curativos_complexos: "Curativos complexos",
};

function calcularIdade(dataNasc: string | null, idadeFallback: number | null): string {
  if (dataNasc) {
    const nasc = new Date(dataNasc);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return `${idade} anos`;
  }
  return idadeFallback != null ? `${idadeFallback} anos` : "—";
}

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  const s = iso.split("T")[0];
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function InfoRow({ icon, label, value, cores, tf }: any) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={cores.primary} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.infoLabel, { color: cores.muted, fontSize: tf(12) }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: cores.text, fontSize: tf(14) }]}>{value}</Text>
      </View>
    </View>
  );
}

function SectionCard({ icon, label, children, cores, tf }: any) {
  return (
    <View style={[styles.card, { backgroundColor: cores.card, borderColor: cores.border }]}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={18} color={cores.primary} />
        <Text style={[styles.cardLabel, { color: cores.text, fontSize: tf(14) }]}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

export default function DetalhePaciente({ route, navigation }: any) {
  const { cores, tf } = useTema();
  const pacienteParam = route.params?.paciente;
  const [paciente, setPaciente] = useState<any>(pacienteParam || null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const id = pacienteParam?.paciente_id;
    if (!id) { setCarregando(false); return; }
    api.get(`/pacientes/${id}`)
      .then((res) => setPaciente(res.data))
      .catch(() => setPaciente(pacienteParam))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={cores.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!paciente) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: cores.text }}>Paciente não encontrado.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={{ color: cores.primary }}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  let categorias: string[] = [];
  if (Array.isArray(paciente.categorias_cuidado)) {
    categorias = paciente.categorias_cuidado;
  } else if (typeof paciente.categorias_cuidado === "string") {
    try { categorias = JSON.parse(paciente.categorias_cuidado); } catch { categorias = []; }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={cores.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: cores.primary, fontSize: tf(20) }]} numberOfLines={1}>
          {paciente.nome}
        </Text>
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: cores.primary }]}
          onPress={() => navigation.navigate("EditarPaciente", { paciente })}
        >
          <Ionicons name="pencil-outline" size={16} color="#fff" />
          <Text style={[styles.editBtnText, { fontSize: tf(13) }]}>Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Identificação */}
        <SectionCard icon="person-outline" label="Identificação" cores={cores} tf={tf}>
          <InfoRow icon="calendar-outline" label="Data de nascimento" value={formatarData(paciente.data_nascimento)} cores={cores} tf={tf} />
          <InfoRow icon="hourglass-outline" label="Idade" value={calcularIdade(paciente.data_nascimento, paciente.idade)} cores={cores} tf={tf} />
          <InfoRow icon="male-female-outline" label="Gênero" value={paciente.genero} cores={cores} tf={tf} />
          <InfoRow icon="person-circle-outline" label="Responsável legal" value={paciente.responsavel_legal} cores={cores} tf={tf} />
          <InfoRow icon="call-outline" label="Telefone de contato" value={paciente.telefone_contato} cores={cores} tf={tf} />
        </SectionCard>

        {/* Categorias de cuidado */}
        {categorias.length > 0 && (
          <SectionCard icon="heart-outline" label="Categorias de Cuidado" cores={cores} tf={tf}>
            <View style={styles.tagsWrap}>
              {categorias.map((cat) => (
                <View key={cat} style={[styles.tag, { backgroundColor: cores.primary + "18", borderColor: cores.primary + "40" }]}>
                  <Text style={[styles.tagText, { color: cores.primary, fontSize: tf(12) }]}>
                    {CATEGORIAS_LABEL[cat] || cat}
                  </Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* Observações */}
        {(paciente.restricoes_alimentares || paciente.observacoes_rotina || paciente.observacoes) && (
          <SectionCard icon="document-text-outline" label="Observações" cores={cores} tf={tf}>
            <InfoRow icon="nutrition-outline" label="Restrições alimentares" value={paciente.restricoes_alimentares} cores={cores} tf={tf} />
            <InfoRow icon="clipboard-outline" label="Observações da rotina" value={paciente.observacoes_rotina || paciente.observacoes} cores={cores} tf={tf} />
          </SectionCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontWeight: "700" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  editBtnText: { color: "#fff", fontWeight: "700" },
  scroll: { padding: 16, gap: 12 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cardLabel: { fontWeight: "700" },
  infoRow: { flexDirection: "row", alignItems: "flex-start" },
  infoLabel: { fontWeight: "500", marginBottom: 1 },
  infoValue: { fontWeight: "400" },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontWeight: "600" },
});
