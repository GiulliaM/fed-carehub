import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Text } from "../../components/Text";
import { AnimatedPressable as TouchableOpacity } from "../../components/AnimatedPressable";
import { useTema } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import api from "../../config/api";
import { normalizarFotoUrl } from "../../utils/autenticacao";

type Usuario = {
  usuario_id: number;
  nome: string;
  email: string;
  tipo: "familiar" | "cuidador";
  telefone: string | null;
  foto_url: string | null;
  created_at: string;
};

type FiltroTipo = "todos" | "familiar" | "cuidador";

const FILTROS: { label: string; valor: FiltroTipo }[] = [
  { label: "Todos", valor: "todos" },
  { label: "Familiares", valor: "familiar" },
  { label: "Cuidadores", valor: "cuidador" },
];

export default function AdminListaUsuarios() {
  const { cores } = useTema();
  const { showToast } = useToast();
  const [filtro, setFiltro] = useState<FiltroTipo>("todos");
  const [lista, setLista] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async (f: FiltroTipo = filtro) => {
    try {
      const query = f === "todos" ? "" : `?tipo=${f}`;
      const res = await api.get(`/admin/usuarios${query}`);
      setLista(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast("Erro ao carregar usuários.", "error");
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, [filtro]);

  useFocusEffect(useCallback(() => { setCarregando(true); carregar(filtro); }, [filtro]));

  const onFiltro = (f: FiltroTipo) => {
    setFiltro(f);
    setCarregando(true);
    carregar(f);
  };

  const onRefresh = () => { setRefreshing(true); carregar(filtro); };

  const badgeTipo = (tipo: string) => {
    if (tipo === "familiar") return { bg: cores.accent, label: "Familiar" };
    return { bg: cores.primary, label: "Cuidador" };
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <Text style={[styles.titulo, { color: cores.primary }]}>Usuários</Text>
        {!carregando && (
          <Text style={[styles.contador, { color: cores.muted }]}>{lista.length} registros</Text>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filtrosScroll, { borderBottomColor: cores.border }]}
        contentContainerStyle={styles.filtrosContent}
      >
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f.valor}
            style={[
              styles.chip,
              {
                backgroundColor: filtro === f.valor ? cores.primary : cores.card,
                borderColor: filtro === f.valor ? cores.primary : cores.border,
              },
            ]}
            onPress={() => onFiltro(f.valor)}
          >
            <Text style={[styles.chipText, { color: filtro === f.valor ? "#fff" : cores.muted }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {carregando ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={cores.primary} />
        </View>
      ) : lista.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={64} color={cores.muted} />
          <Text style={[styles.emptyText, { color: cores.muted }]}>Nenhum usuário encontrado.</Text>
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => String(item.usuario_id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[cores.primary]} tintColor={cores.primary} />
          }
          renderItem={({ item }) => {
            const badge = badgeTipo(item.tipo);
            const foto = normalizarFotoUrl(item.foto_url);
            return (
              <View style={[styles.card, { backgroundColor: cores.card, borderColor: cores.border }]}>
                <View style={styles.cardRow}>
                  {foto ? (
                    <Image source={{ uri: foto }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: cores.primary + "30" }]}>
                      <Ionicons name="person" size={22} color={cores.primary} />
                    </View>
                  )}
                  <View style={styles.cardInfo}>
                    <Text style={[styles.nome, { color: cores.text }]} numberOfLines={1}>{item.nome}</Text>
                    <Text style={[styles.email, { color: cores.muted }]} numberOfLines={1}>{item.email}</Text>
                    {item.telefone && (
                      <Text style={[styles.telefone, { color: cores.muted }]}>{item.telefone}</Text>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={styles.badgeText}>{badge.label}</Text>
                    </View>
                    <Text style={[styles.data, { color: cores.muted }]}>
                      {new Date(item.created_at).toLocaleDateString("pt-BR")}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titulo: { fontSize: 22, fontWeight: "700" },
  contador: { fontSize: 13 },
  filtrosScroll: { borderBottomWidth: 1, maxHeight: 56 },
  filtrosContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: "row" },
  chip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "600" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyText: { textAlign: "center", fontSize: 16, marginTop: 16 },
  list: { padding: 16, gap: 10 },
  card: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  nome: { fontSize: 14, fontWeight: "700" },
  email: { fontSize: 12, marginTop: 1 },
  telefone: { fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  data: { fontSize: 11 },
});
