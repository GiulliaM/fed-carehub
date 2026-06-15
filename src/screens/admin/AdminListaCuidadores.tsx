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
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Text } from "../../components/Text";
import { AnimatedPressable as TouchableOpacity } from "../../components/AnimatedPressable";
import { useTema } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import api from "../../config/api";
import { normalizarFotoUrl } from "../../utils/autenticacao";

type Cuidador = {
  usuario_id: number;
  nome: string;
  email: string;
  bio: string | null;
  especialidades: string[];
  cidade: string | null;
  foto_url: string | null;
  status: "pendente" | "aprovado" | "rejeitado";
};

type FiltroStatus = "todos" | "pendente" | "aprovado" | "rejeitado";

const FILTROS: { label: string; valor: FiltroStatus }[] = [
  { label: "Todos", valor: "todos" },
  { label: "Pendentes", valor: "pendente" },
  { label: "Aprovados", valor: "aprovado" },
  { label: "Rejeitados", valor: "rejeitado" },
];

function badgeStatus(status: string, cores: Record<string, string>) {
  const map: Record<string, { bg: string; label: string }> = {
    pendente: { bg: cores.warning, label: "Pendente" },
    aprovado: { bg: cores.success, label: "Aprovado" },
    rejeitado: { bg: cores.danger, label: "Rejeitado" },
  };
  return map[status] ?? { bg: cores.muted, label: status };
}

export default function AdminListaCuidadores({ navigation }: any) {
  const { cores } = useTema();
  const { showToast } = useToast();
  const [filtro, setFiltro] = useState<FiltroStatus>("pendente");
  const [lista, setLista] = useState<Cuidador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async (f: FiltroStatus = filtro) => {
    try {
      const query = f === "todos" ? "" : `?status=${f}`;
      const res = await api.get(`/admin/cuidadores${query}`);
      setLista(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast("Erro ao carregar cuidadores.", "error");
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, [filtro]);

  useFocusEffect(useCallback(() => { setCarregando(true); carregar(filtro); }, [filtro]));

  const onFiltro = (f: FiltroStatus) => {
    setFiltro(f);
    setCarregando(true);
    carregar(f);
  };

  const onRefresh = () => { setRefreshing(true); carregar(filtro); };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <Text style={[styles.titulo, { color: cores.primary }]}>Cuidadores</Text>
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
            <Text
              style={[
                styles.chipText,
                { color: filtro === f.valor ? "#fff" : cores.muted },
              ]}
            >
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
          <Ionicons name="person-outline" size={64} color={cores.muted} />
          <Text style={[styles.emptyText, { color: cores.muted }]}>
            Nenhum cuidador encontrado.
          </Text>
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
            const badge = badgeStatus(item.status, cores);
            const foto = normalizarFotoUrl(item.foto_url);
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: cores.card, borderColor: cores.border }]}
                onPress={() => navigation.navigate("AdminDetalhesCuidador", { usuarioId: item.usuario_id })}
              >
                <View style={styles.cardTop}>
                  {foto ? (
                    <Image source={{ uri: foto }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: cores.primary }]}>
                      <Ionicons name="person" size={28} color="#fff" />
                    </View>
                  )}
                  <View style={styles.cardInfo}>
                    <Text style={[styles.nome, { color: cores.text }]} numberOfLines={1}>{item.nome}</Text>
                    <Text style={[styles.email, { color: cores.muted }]} numberOfLines={1}>{item.email}</Text>
                    {item.cidade && (
                      <Text style={[styles.local, { color: cores.muted }]} numberOfLines={1}>
                        <Feather name="map-pin" size={12} /> {item.cidade}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={styles.badgeText}>{badge.label}</Text>
                  </View>
                </View>
                {Array.isArray(item.especialidades) && item.especialidades.length > 0 && (
                  <View style={styles.tagsRow}>
                    {item.especialidades.slice(0, 3).map((e) => (
                      <View key={e} style={[styles.tag, { backgroundColor: cores.primary + "18" }]}>
                        <Text style={[styles.tagText, { color: cores.primary }]}>{e}</Text>
                      </View>
                    ))}
                    {item.especialidades.length > 3 && (
                      <Text style={[styles.tagText, { color: cores.muted }]}>+{item.especialidades.length - 3}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titulo: { fontSize: 22, fontWeight: "700" },
  filtrosScroll: { borderBottomWidth: 1, maxHeight: 56 },
  filtrosContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: "row" },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyText: { textAlign: "center", fontSize: 16, marginTop: 16 },
  list: { padding: 16, gap: 12 },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  nome: { fontSize: 15, fontWeight: "700" },
  email: { fontSize: 12, marginTop: 1 },
  local: { fontSize: 12, marginTop: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tagText: { fontSize: 11 },
});
