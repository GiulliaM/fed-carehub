import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import api from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CATALOGO_DIARIO } from "../utils/diarioCatalogo";
import dayjs from "dayjs";

const labelFromCodigo = (codigo: string): string => {
  for (const cat of CATALOGO_DIARIO) {
    const item = cat.itens.find((i) => i.codigo === codigo);
    if (item) return item.label;
  }
  return codigo;
};

const iconFromCodigo = (codigo: string): string => {
  for (const cat of CATALOGO_DIARIO) {
    const item = cat.itens.find((i) => i.codigo === codigo);
    if (item) return item.icon;
  }
  return "ellipsis-horizontal-outline";
};

export default function Diario({ navigation }: any) {
  const { cores, tf } = useTema();
  const [registros, setRegistros] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const fetchRegistros = useCallback(async () => {
    setCarregando(true);
    try {
      const rawPac = await AsyncStorage.getItem("paciente");
      const paciente = rawPac ? JSON.parse(rawPac) : null;
      const url = paciente?.paciente_id
        ? `/diario?paciente_id=${paciente.paciente_id}`
        : "/diario";
      const data = await api.get(url);
      setRegistros(Array.isArray(data) ? data : []);
    } catch {
      setRegistros([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRegistros();
    }, [fetchRegistros])
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: cores.background }]}
    >
      <View style={styles.container}>
        <Text
          style={[
            styles.title,
            { color: cores.primary, fontSize: tf(24) },
          ]}
        >
          Diario
        </Text>

        {carregando ? (
          <ActivityIndicator
            size="large"
            color={cores.primary}
            style={{ marginTop: 30 }}
          />
        ) : registros.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={48}
              color={cores.muted}
            />
            <Text
              style={[
                styles.emptyText,
                { color: cores.muted, fontSize: tf(15) },
              ]}
            >
              Nenhum registro encontrado.
            </Text>
          </View>
        ) : (
          <FlatList
            data={registros}
            keyExtractor={(item) =>
              item.registro_id?.toString() || Math.random().toString()
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: cores.card,
                    borderColor: cores.border,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text
                      style={[
                        styles.cardDate,
                        { color: cores.primary, fontSize: tf(15) },
                      ]}
                    >
                      {dayjs(item.data).format("DD/MM/YYYY")}
                    </Text>
                    <Text
                      style={[
                        styles.cardTime,
                        { color: cores.muted, fontSize: tf(13) },
                      ]}
                    >
                      {item.hora ? item.hora.slice(0, 5) : ""}
                      {item.autor_nome
                        ? ` - ${item.autor_nome}`
                        : ""}
                    </Text>
                  </View>
                  <Ionicons
                    name="journal-outline"
                    size={22}
                    color={cores.primary}
                  />
                </View>

                {/* Itens categorizados */}
                {item.itens && item.itens.length > 0 && (
                  <View style={styles.itensContainer}>
                    {item.itens.map((it: any, idx: number) => (
                      <View key={idx} style={styles.itemChip}>
                        <Ionicons
                          name={iconFromCodigo(it.codigo) as any}
                          size={16}
                          color={cores.primary}
                        />
                        <Text
                          style={[
                            styles.itemText,
                            { color: cores.text, fontSize: tf(12) },
                          ]}
                        >
                          {labelFromCodigo(it.codigo)}
                          {it.valor ? `: ${it.valor}` : ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {item.comentario && (
                  <Text
                    style={[
                      styles.comentario,
                      { color: cores.text, fontSize: tf(14) },
                    ]}
                  >
                    {item.comentario}
                  </Text>
                )}
              </View>
            )}
          />
        )}

        <TouchableOpacity
          style={[styles.floatingBtn, { backgroundColor: cores.primary }]}
          onPress={() => navigation.navigate("NovoRegistro")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16 },
  title: { fontWeight: "700", textAlign: "center", marginBottom: 14 },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: { marginTop: 12, textAlign: "center" },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardDate: { fontWeight: "700" },
  cardTime: { marginTop: 2 },
  itensContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  itemChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(96,165,250,0.1)",
    gap: 4,
  },
  itemText: { fontWeight: "500" },
  comentario: { marginTop: 4, lineHeight: 20 },
  floatingBtn: {
    position: "absolute",
    bottom: 26,
    right: 26,
    width: 58,
    height: 58,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
});
