import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTema } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import api from "../config/api";
import {
  CATALOGO_DIARIO,
  type DiarioCategoria,
  type DiarioItem,
} from "../utils/diarioCatalogo";

interface SelectedItem {
  categoria: DiarioCategoria;
  codigo: string;
  valor: string | null;
}

export default function NovoRegistro({ navigation }: any) {
  const { cores, tf } = useTema();
  const [comentario, setComentario] = useState("");
  const [selecionados, setSelecionados] = useState<SelectedItem[]>([]);
  const [expandedCat, setExpandedCat] = useState<DiarioCategoria | null>(
    "humor"
  );
  const [campoValues, setCampoValues] = useState<Record<string, string>>({});
  const [contagemValues, setContagemValues] = useState<
    Record<string, number>
  >({});
  const [salvando, setSalvando] = useState(false);

  const estaSelecionado = (categoria: DiarioCategoria, codigo: string) =>
    selecionados.some(
      (s) => s.categoria === categoria && s.codigo === codigo
    );

  const toggleItem = (cat: DiarioCategoria, item: DiarioItem) => {
    if (estaSelecionado(cat, item.codigo)) {
      setSelecionados((prev) =>
        prev.filter(
          (s) => !(s.categoria === cat && s.codigo === item.codigo)
        )
      );
    } else {
      setSelecionados((prev) => [
        ...prev,
        { categoria: cat, codigo: item.codigo, valor: null },
      ]);
    }
  };

  const handleSalvar = async () => {
    if (selecionados.length === 0 && !comentario.trim()) {
      Alert.alert("Aviso", "Selecione ao menos um item ou escreva um comentario.");
      return;
    }

    setSalvando(true);
    try {
      const rawPaciente = await AsyncStorage.getItem("paciente");
      const paciente = rawPaciente ? JSON.parse(rawPaciente) : null;

      if (!paciente?.paciente_id) {
        Alert.alert("Erro", "Nenhum paciente vinculado.");
        return;
      }

      const hoje = new Date();
      const itens = selecionados.map((s) => {
        let valor = null;
        const catItem = CATALOGO_DIARIO.find(
          (c) => c.key === s.categoria
        )?.itens.find((i) => i.codigo === s.codigo);

        if (catItem?.temCampo) {
          valor = campoValues[s.codigo] || null;
        } else if (catItem?.contagem) {
          valor = String(contagemValues[s.codigo] || 0);
        }
        return { categoria: s.categoria, codigo: s.codigo, valor };
      });

      await api.post("/diario", {
        data: hoje.toISOString().split("T")[0],
        hora: hoje.toTimeString().split(" ")[0],
        comentario: comentario.trim() || null,
        paciente_id: paciente.paciente_id,
        itens,
      });

      Alert.alert("Sucesso", "Registro adicionado!");
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Nao foi possivel salvar o registro.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: cores.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text
          style={[
            styles.title,
            { color: cores.primary, fontSize: tf(24) },
          ]}
        >
          Novo Registro
        </Text>

        {/* Categorias com acordeao */}
        {CATALOGO_DIARIO.map((cat) => {
          const isExpanded = expandedCat === cat.key;
          const contagemSelecionados = selecionados.filter(
            (s) => s.categoria === cat.key
          ).length;

          return (
            <View key={cat.key} style={{ marginBottom: 10 }}>
              <TouchableOpacity
                style={[
                  styles.catHeader,
                  {
                    backgroundColor: cores.card,
                    borderColor: cores.border,
                  },
                ]}
                onPress={() =>
                  setExpandedCat(isExpanded ? null : cat.key)
                }
              >
                <Ionicons
                  name={cat.icon as any}
                  size={22}
                  color={cores.primary}
                />
                <Text
                  style={[
                    styles.catTitle,
                    { color: cores.text, fontSize: tf(16) },
                  ]}
                >
                  {cat.label}
                </Text>
                {contagemSelecionados > 0 && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: cores.primary },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {contagemSelecionados}
                    </Text>
                  </View>
                )}
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={cores.muted}
                  style={{ marginLeft: "auto" }}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View
                  style={[
                    styles.catContent,
                    {
                      backgroundColor: cores.card,
                      borderColor: cores.border,
                    },
                  ]}
                >
                  <View style={styles.itensGrid}>
                    {cat.itens.map((item) => {
                      const active = estaSelecionado(cat.key, item.codigo);
                      return (
                        <View key={item.codigo} style={{ marginBottom: 6 }}>
                          <TouchableOpacity
                            style={[
                              styles.itemBtn,
                              {
                                backgroundColor: active
                                  ? cores.primary + "20"
                                  : cores.background,
                                borderColor: active
                                  ? cores.primary
                                  : cores.border,
                              },
                            ]}
                            onPress={() => toggleItem(cat.key, item)}
                          >
                            <Ionicons
                              name={item.icon as any}
                              size={20}
                              color={
                                active ? cores.primary : cores.muted
                              }
                            />
                            <Text
                              style={[
                                styles.itemLabel,
                                {
                                  color: active
                                    ? cores.primary
                                    : cores.text,
                                  fontSize: tf(13),
                                },
                              ]}
                            >
                              {item.label}
                            </Text>
                            {active && (
                              <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color={cores.primary}
                                style={{ marginLeft: "auto" }}
                              />
                            )}
                          </TouchableOpacity>

                          {/* Campo extra */}
                          {active && item.temCampo && (
                            <TextInput
                              style={[
                                styles.extraInput,
                                {
                                  backgroundColor: cores.inputBg,
                                  color: cores.inputText,
                                  borderColor: cores.border,
                                },
                              ]}
                              placeholder={item.campoLabel || "Detalhes"}
                              placeholderTextColor={
                                cores.inputPlaceholder
                              }
                              value={campoValues[item.codigo] || ""}
                              onChangeText={(t) =>
                                setCampoValues((prev) => ({
                                  ...prev,
                                  [item.codigo]: t,
                                }))
                              }
                            />
                          )}

                          {/* Contagem */}
                          {active && item.contagem && (
                            <View style={styles.contagemRow}>
                              <TouchableOpacity
                                style={[
                                  styles.contagemBtn,
                                  { borderColor: cores.border },
                                ]}
                                onPress={() =>
                                  setContagemValues((prev) => ({
                                    ...prev,
                                    [item.codigo]: Math.max(
                                      0,
                                      (prev[item.codigo] || 0) - 1
                                    ),
                                  }))
                                }
                              >
                                <Ionicons
                                  name="remove"
                                  size={18}
                                  color={cores.text}
                                />
                              </TouchableOpacity>
                              <Text
                                style={[
                                  styles.contagemVal,
                                  {
                                    color: cores.text,
                                    fontSize: tf(16),
                                  },
                                ]}
                              >
                                {contagemValues[item.codigo] || 0}
                              </Text>
                              <TouchableOpacity
                                style={[
                                  styles.contagemBtn,
                                  { borderColor: cores.border },
                                ]}
                                onPress={() =>
                                  setContagemValues((prev) => ({
                                    ...prev,
                                    [item.codigo]:
                                      (prev[item.codigo] || 0) + 1,
                                  }))
                                }
                              >
                                <Ionicons
                                  name="add"
                                  size={18}
                                  color={cores.text}
                                />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Comentario */}
        <Text
          style={[
            styles.label,
            { color: cores.text, fontSize: tf(15) },
          ]}
        >
          Comentario / Observacoes
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: cores.inputBg,
              color: cores.inputText,
              borderColor: cores.border,
            },
          ]}
          placeholder="Algo mais para registrar?"
          placeholderTextColor={cores.inputPlaceholder}
          value={comentario}
          onChangeText={setComentario}
          multiline
        />

        {/* Botoes */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: cores.border }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[{ color: cores.muted, fontWeight: "600" }]}>
              Cancelar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: salvando
                  ? cores.muted
                  : cores.primary,
              },
            ]}
            disabled={salvando}
            onPress={handleSalvar}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.saveText}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16, paddingBottom: 40 },
  title: { fontWeight: "700", textAlign: "center", marginBottom: 16 },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  catTitle: { fontWeight: "700" },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  catContent: {
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    marginTop: -4,
  },
  itensGrid: {},
  itemBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  itemLabel: { fontWeight: "600" },
  extraInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
    marginLeft: 28,
    fontSize: 14,
  },
  contagemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginLeft: 28,
    gap: 12,
  },
  contagemBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contagemVal: { fontWeight: "700", minWidth: 24, textAlign: "center" },
  label: { fontWeight: "600", marginBottom: 8, marginTop: 8 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    textAlignVertical: "top",
    fontSize: 15,
    minHeight: 100,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
