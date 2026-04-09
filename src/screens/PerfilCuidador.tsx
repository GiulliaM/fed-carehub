import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import api from "../config/api";

const ESPECIALIDADES_SUGERIDAS = [
  "Alzheimer",
  "Mobilidade Reduzida",
  "Pós-operatório",
  "Técnico de Enfermagem",
  "Cuidados Paliativos",
  "Diabetes",
  "Hipertensão",
  "Idosos",
  "Acompanhamento Domiciliar",
];

export default function PerfilCuidador({ navigation }: any) {
  const { cores } = useTema();
  const [carregando, setCarregando] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState("");
  const [precoHora, setPrecoHora] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [telefone, setTelefone] = useState("");
  const [disponivelBusca, setDisponivelBusca] = useState(true);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [novaTag, setNovaTag] = useState("");

  const carregarPerfil = useCallback(async () => {
    try {
      setCarregando(true);
      const res = await api.get("/cuidador/perfil");
      if (res && typeof res === "object") {
        setBio(res.bio || "");
        setPrecoHora(res.preco_hora != null ? String(res.preco_hora) : "");
        setCidade(res.cidade || "");
        setBairro(res.bairro || "");
        setTelefone(res.telefone || "");
        setDisponivelBusca(res.disponivel_busca !== 0);
        setEspecialidades(Array.isArray(res.especialidades) ? res.especialidades : []);
      } else {
        setBio("");
        setPrecoHora("");
        setCidade("");
        setBairro("");
        setTelefone("");
        setDisponivelBusca(true);
        setEspecialidades([]);
      }
    } catch (err: any) {
      if (err?.response?.status === 403) {
        Alert.alert("Acesso negado", "Esta área é apenas para cuidadores.");
        navigation.goBack();
        return;
      }
      Alert.alert("Erro", "Não foi possível carregar o perfil.");
    } finally {
      setCarregando(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      carregarPerfil();
    }, [carregarPerfil])
  );

  const adicionarEspecialidade = (tag: string) => {
    const t = tag.trim();
    if (t && !especialidades.includes(t)) {
      setEspecialidades([...especialidades, t]);
    }
    setNovaTag("");
  };

  const removerEspecialidade = (tag: string) => {
    setEspecialidades(especialidades.filter((e) => e !== tag));
  };

  const salvar = async () => {
    try {
      setSaving(true);
      await api.post("/cuidador/perfil", {
        bio: bio.trim() || null,
        preco_hora: precoHora ? parseFloat(precoHora.replace(",", ".")) : null,
        cidade: cidade.trim() || null,
        bairro: bairro.trim() || null,
        telefone: telefone.trim() || null,
        disponivel_busca: disponivelBusca,
        especialidades,
      });
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    } catch (err: any) {
      if (err?.response?.status === 403) {
        Alert.alert("Acesso negado", "Esta área é apenas para cuidadores.");
        return;
      }
      Alert.alert("Erro", err?.response?.data?.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (carregando) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={cores.primary} />
          <Text style={[styles.carregandoText, { color: cores.text }]}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={[styles.title, { color: cores.primary }]}>Perfil Profissional</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: cores.card }]}>
            <Text style={[styles.label, { color: cores.text }]}>Biografia (breve)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: cores.text, borderColor: cores.muted }]}
              placeholder="Conte um pouco sobre você e sua experiência..."
              placeholderTextColor={cores.muted}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={[styles.card, { backgroundColor: cores.card }]}>
            <Text style={[styles.label, { color: cores.text }]}>Especialidades</Text>
            <View style={styles.tagRow}>
              <TextInput
                style={[styles.input, styles.tagInput, { color: cores.text, borderColor: cores.muted }]}
                placeholder="Ex: Alzheimer"
                placeholderTextColor={cores.muted}
                value={novaTag}
                onChangeText={setNovaTag}
                onSubmitEditing={() => adicionarEspecialidade(novaTag)}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.btnTag, { backgroundColor: cores.primary }]}
                onPress={() => adicionarEspecialidade(novaTag)}
              >
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.sugeridasRow}>
              {ESPECIALIDADES_SUGERIDAS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.chip,
                    especialidades.includes(s) && { backgroundColor: cores.primary },
                  ]}
                  onPress={() =>
                    especialidades.includes(s) ? removerEspecialidade(s) : adicionarEspecialidade(s)
                  }
                >
                  <Text style={[styles.chipText, { color: especialidades.includes(s) ? "#fff" : cores.text }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.tagsList}>
              {especialidades.map((e) => (
                <View key={e} style={[styles.tagChip, { backgroundColor: cores.primary }]}>
                  <Text style={styles.tagChipText}>{e}</Text>
                  <TouchableOpacity onPress={() => removerEspecialidade(e)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: cores.card }]}>
            <Text style={[styles.label, { color: cores.text }]}>Preço médio/hora (R$)</Text>
            <TextInput
              style={[styles.input, { color: cores.text, borderColor: cores.muted }]}
              placeholder="Ex: 50,00"
              placeholderTextColor={cores.muted}
              value={precoHora}
              onChangeText={setPrecoHora}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={[styles.card, { backgroundColor: cores.card }]}>
            <Text style={[styles.label, { color: cores.text }]}>Localização</Text>
            <TextInput
              style={[styles.input, { color: cores.text, borderColor: cores.muted }]}
              placeholder="Cidade"
              placeholderTextColor={cores.muted}
              value={cidade}
              onChangeText={setCidade}
            />
            <TextInput
              style={[styles.input, { marginTop: 10, color: cores.text, borderColor: cores.muted }]}
              placeholder="Bairro"
              placeholderTextColor={cores.muted}
              value={bairro}
              onChangeText={setBairro}
            />
          </View>

          <View style={[styles.card, { backgroundColor: cores.card }]}>
            <Text style={[styles.label, { color: cores.text }]}>Telefone (WhatsApp)</Text>
            <TextInput
              style={[styles.input, { color: cores.text, borderColor: cores.muted }]}
              placeholder="(11) 99999-9999"
              placeholderTextColor={cores.muted}
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={[styles.card, styles.rowCard, { backgroundColor: cores.card }]}>
            <Text style={[styles.label, { color: cores.text }]}>Aparecer na busca</Text>
            <Switch
              value={disponivelBusca}
              onValueChange={setDisponivelBusca}
              trackColor={{ false: "#ccc", true: cores.primary }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity
            style={[styles.btnSalvar, { backgroundColor: cores.primary }]}
            onPress={salvar}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnSalvarText}>Salvar perfil</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  carregandoText: { marginTop: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: { marginRight: 12, padding: 4 },
  title: { fontSize: 20, fontWeight: "700" },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  rowCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tagInput: { flex: 1 },
  btnTag: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  sugeridasRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  chipText: { fontSize: 14 },
  tagsList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagChipText: { color: "#fff", fontSize: 14 },
  btnSalvar: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnSalvarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
