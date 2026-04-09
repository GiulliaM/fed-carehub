import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Share,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../config/api";

export default function VincularCuidador({ route, navigation }: any) {
  const { cores } = useTema();
  const [paciente, setPaciente] = useState<any>(route.params?.paciente || null);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [codigo, setCodigo] = useState("");
  const [expiraEm, setExpiraEm] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      const list = await api.get("/pacientes");
      setPacientes(Array.isArray(list) ? list : []);
      const p = route.params?.paciente;
      if (p?.paciente_id) {
        setPaciente(p);
        const convite = await api.get(`/vinculos/convite/${p.paciente_id}`);
        if (convite?.codigo) {
          setCodigo(convite.codigo);
          setExpiraEm(convite.expira_em || "");
        } else {
          setCodigo("");
          setExpiraEm("");
        }
      } else if (Array.isArray(list) && list.length > 0) {
        setPaciente(list[0]);
        setCodigo("");
        setExpiraEm("");
      } else {
        setPaciente(null);
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar.");
    } finally {
      setCarregando(false);
    }
  }, [route.params?.paciente]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const formatarExpira = (s: string) => {
    if (!s) return "";
    try {
      const d = new Date(s);
      return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return s; }
  };

  const gerarCodigo = async () => {
    const p = paciente || (pacientes.length === 1 ? pacientes[0] : null);
    if (!p?.paciente_id) {
      Alert.alert("Selecione um paciente", "Cadastre ou selecione o paciente para gerar o código.");
      return;
    }
    try {
      setGerando(true);
      const res = await api.post("/vinculos/gerar-convite", { paciente_id: p.paciente_id });
      setCodigo(res.codigo || "");
      setExpiraEm(res.expira_em || "");
      Alert.alert("Código gerado", "O cuidador deve digitar este código em \"Meus pacientes\" antes de expirar.");
    } catch (err: any) {
      Alert.alert("Erro", err?.response?.data?.message || "Não foi possível gerar o código.");
    } finally {
      setGerando(false);
    }
  };

  const compartilhar = () => {
    if (!codigo || !paciente?.nome) return;
    const texto = `Código CareHub para vincular ao paciente ${paciente.nome}: ${codigo}. Válido por 24h.`;
    Share.share({ message: texto, title: "Convite CareHub" }).catch(() => {});
  };

  if (carregando) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={cores.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={cores.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: cores.primary }]}>Vincular cuidador</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {pacientes.length > 1 && (
          <View style={[styles.card, { backgroundColor: cores.card }]}>
            <Text style={[styles.label, { color: cores.text }]}>Paciente</Text>
            <Text style={[styles.value, { color: cores.text }]}>{paciente?.nome || "—"}</Text>
            {pacientes.map((p) => (
              <TouchableOpacity
                key={p.paciente_id}
                onPress={() => { setPaciente(p); setCodigo(""); setExpiraEm(""); }}
                style={[styles.pacienteBtn, paciente?.paciente_id === p.paciente_id && { backgroundColor: cores.primary + "20" }]}
              >
                <Text style={[styles.pacienteBtnText, { color: cores.text }]}>{p.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[styles.card, styles.codigoCard, { backgroundColor: cores.card }]}>
          <Text style={[styles.label, { color: cores.text }]}>Código de 6 dígitos</Text>
          {codigo ? (
            <>
              <Text style={[styles.codigo, { color: cores.primary }]}>{codigo}</Text>
              {expiraEm ? (
                <Text style={[styles.expira, { color: cores.muted }]}>Válido até {formatarExpira(expiraEm)}</Text>
              ) : null}
              <TouchableOpacity style={[styles.btnShare, { backgroundColor: cores.primary }]} onPress={compartilhar}>
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.btnShareText}>Compartilhar código</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.btnGerar, { backgroundColor: cores.primary }]}
              onPress={gerarCodigo}
              disabled={gerando || !paciente?.paciente_id}
            >
              {gerando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnGerarText}>Gerar código</Text>}
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.instrucao, { color: cores.muted }]}>
          O cuidador deve abrir o app, ir em Perfil → Meus pacientes → Adicionar paciente e digitar o código. O código expira em 24 horas.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  backBtn: { marginRight: 12, padding: 4 },
  title: { fontSize: 20, fontWeight: "700" },
  scroll: { padding: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  value: { fontSize: 16, marginBottom: 8 },
  pacienteBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginTop: 4 },
  pacienteBtnText: { fontSize: 15 },
  codigoCard: { alignItems: "center" },
  codigo: { fontSize: 32, fontWeight: "800", letterSpacing: 8, marginVertical: 12 },
  expira: { fontSize: 13, marginBottom: 12 },
  btnGerar: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  btnGerarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnShare: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  btnShareText: { color: "#fff", fontWeight: "700" },
  instrucao: { fontSize: 14, lineHeight: 22, marginTop: 8 },
});
