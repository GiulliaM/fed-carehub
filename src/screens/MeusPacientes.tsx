import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../config/api";

type PacienteVinculo = { paciente_id: number; nome: string; idade?: number; genero?: string; data_vinculo?: string };

export default function MeusPacientes({ navigation, route }: any) {
  const { cores } = useTema();
  const [lista, setLista] = useState<PacienteVinculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalCodigo, setModalCodigo] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      const res = await api.get("/vinculos/meus-pacientes");
      setLista(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        Alert.alert("Acesso negado", "Esta área é apenas para cuidadores.");
        navigation.goBack();
        return;
      }
      setLista([]);
    } finally {
      setCarregando(false);
    }
  }, [navigation]);

  useFocusEffect(useCallback(() => {
    carregar();
    if (route?.params?.abrirCodigo) setModalCodigo(true);
  }, [carregar, route?.params?.abrirCodigo]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }, [carregar]);

  const aceitarCodigo = async () => {
    const c = codigo.replace(/\D/g, "").trim();
    if (c.length !== 6) {
      Alert.alert("Código inválido", "Digite os 6 dígitos do código recebido pelo familiar.");
      return;
    }
    try {
      setEnviando(true);
      const res = await api.post("/vinculos/aceitar", { codigo: c });
      setModalCodigo(false);
      setCodigo("");
      await carregar();
      if (res?.data?.paciente) {
        await AsyncStorage.setItem("paciente", JSON.stringify(res.data.paciente));
        Alert.alert("Sucesso", "Você foi vinculado ao paciente " + (res.data.paciente.nome || "") + ". Pode acessar a rotina e o histórico médico.");
      } else {
        Alert.alert("Sucesso", "Vínculo criado. Selecione o paciente na lista para acessar a rotina.");
      }
    } catch (err: any) {
      Alert.alert("Erro", err?.response?.data?.message || "Código inválido ou expirado.");
    } finally {
      setEnviando(false);
    }
  };

  const selecionarPaciente = async (p: PacienteVinculo) => {
    await AsyncStorage.setItem("paciente", JSON.stringify(p));
    Alert.alert("Paciente selecionado", "Agora você pode acessar a rotina e o histórico deste paciente.");
    navigation.navigate("Abas");
  };

  const confirmarDesvincular = (p: PacienteVinculo) => {
    Alert.alert(
      "Desvincular paciente",
      `Tem certeza que deseja se desvincular de ${p.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Desvincular", style: "destructive", onPress: () => desvincular(p) },
      ]
    );
  };

  const desvincular = async (p: PacienteVinculo) => {
    try {
      await api.delete(`/vinculos/${p.paciente_id}`);
      setLista((prev) => prev.filter((x) => x.paciente_id !== p.paciente_id));
      const pacienteAtual = await AsyncStorage.getItem("paciente");
      if (pacienteAtual) {
        const pa = JSON.parse(pacienteAtual);
        if (pa.paciente_id === p.paciente_id) await AsyncStorage.removeItem("paciente");
      }
      Alert.alert("Desvinculado", `Você foi desvinculado de ${p.nome}.`);
    } catch (err: any) {
      Alert.alert("Erro", err?.response?.data?.message || "Não foi possível desvincular.");
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={cores.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: cores.primary }]}>Meus pacientes</Text>
      </View>

      {carregando ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={cores.primary} />
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: cores.primary }]}
            onPress={() => setModalCodigo(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.addBtnText}>Adicionar paciente (código)</Text>
          </TouchableOpacity>

          {lista.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={64} color={cores.muted} />
              <Text style={[styles.emptyText, { color: cores.muted }]}>Nenhum paciente vinculado.</Text>
              <Text style={[styles.emptySub, { color: cores.muted }]}>Peça o código de 6 dígitos ao familiar e toque em "Adicionar paciente".</Text>
            </View>
          ) : (
            <FlatList
              data={lista}
              keyExtractor={(p) => String(p.paciente_id)}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[cores.primary]} tintColor={cores.primary} />
              }
              renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: cores.card }]}>
                  <TouchableOpacity style={styles.cardMain} onPress={() => selecionarPaciente(item)}>
                    <Ionicons name="person" size={32} color={cores.primary} />
                    <View style={styles.cardBody}>
                      <Text style={[styles.cardNome, { color: cores.text }]}>{item.nome}</Text>
                      {(item.idade != null || item.genero) && (
                        <Text style={[styles.cardInfo, { color: cores.muted }]}>
                          {[item.idade != null ? `${item.idade} anos` : "", item.genero].filter(Boolean).join(" • ")}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={22} color={cores.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.desvincularBtn} onPress={() => confirmarDesvincular(item)}>
                    <Ionicons name="unlink-outline" size={18} color="#E53935" />
                    <Text style={styles.desvincularText}>Desvincular</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </>
      )}

      <Modal visible={modalCodigo} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: cores.card }]}>
            <Text style={[styles.modalTitle, { color: cores.text }]}>Digite o código</Text>
            <Text style={[styles.modalSub, { color: cores.muted }]}>Código de 6 dígitos enviado pelo familiar</Text>
            <TextInput
              style={[styles.input, { color: cores.text, borderColor: cores.muted }]}
              placeholder="000000"
              placeholderTextColor={cores.muted}
              value={codigo}
              onChangeText={(t) => setCodigo(t.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: cores.muted }]} onPress={() => { setModalCodigo(false); setCodigo(""); }}>
                <Text style={[styles.modalBtnTextCancel, { color: cores.muted }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: cores.primary }]} onPress={aceitarCodigo} disabled={enviando || codigo.length !== 6}>
                {enviando ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalBtnText}>Vincular</Text>}
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
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  backBtn: { marginRight: 12, padding: 4 },
  title: { fontSize: 20, fontWeight: "700" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: 16, paddingVertical: 14, borderRadius: 12 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  list: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 12, marginBottom: 12, overflow: "hidden" },
  cardMain: { flexDirection: "row", alignItems: "center", padding: 16 },
  cardBody: { flex: 1, marginLeft: 12 },
  desvincularBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  desvincularText: { color: "#E53935", fontSize: 13, fontWeight: "600" },
  cardNome: { fontSize: 18, fontWeight: "700" },
  cardInfo: { fontSize: 14, marginTop: 2 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyText: { fontSize: 18, fontWeight: "600", textAlign: "center", marginTop: 16 },
  emptySub: { fontSize: 14, textAlign: "center", marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalBox: { width: "100%", maxWidth: 340, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  modalSub: { fontSize: 14, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 24, letterSpacing: 8, textAlign: "center" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1 },
  modalBtnText: { color: "#fff", fontWeight: "700" },
  modalBtnTextCancel: { fontWeight: "600" },
});
