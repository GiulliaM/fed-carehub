import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Text } from "../../components/Text";
import { useTema } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import api from "../../config/api";
import { normalizarFotoUrl } from "../../utils/autenticacao";

type Paciente = {
  paciente_id: number;
  nome: string;
  idade: number | null;
  genero: string | null;
  parentesco: string | null;
  papel: string | null;
};

type Familiar = {
  usuario_id: number;
  nome: string;
  email: string;
  telefone: string | null;
  foto_url: string | null;
  created_at: string;
  pacientes: Paciente[];
};

export default function AdminListaUsuarios() {
  const { cores } = useTema();
  const { showToast } = useToast();
  const [lista, setLista] = useState<Familiar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cuidadores tem aba propria; aqui mostramos os familiares e os pacientes vinculados a eles.
  const carregar = useCallback(async () => {
    try {
      const res = await api.get("/admin/familiares");
      setLista(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast("Erro ao carregar usuários.", "error");
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setCarregando(true); carregar(); }, [carregar]));

  const onRefresh = () => { setRefreshing(true); carregar(); };

  const detalhePaciente = (p: Paciente) => {
    const partes = [
      p.parentesco,
      p.idade != null ? `${p.idade} anos` : null,
      p.genero,
    ].filter(Boolean);
    return partes.join(" • ");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <Text style={[styles.titulo, { color: cores.primary }]}>Familiares</Text>
        {!carregando && (
          <Text style={[styles.contador, { color: cores.muted }]}>
            {lista.length} familiar{lista.length !== 1 ? "es" : ""}
          </Text>
        )}
      </View>

      {carregando ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={cores.primary} />
        </View>
      ) : lista.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={64} color={cores.muted} />
          <Text style={[styles.emptyText, { color: cores.muted }]}>Nenhum familiar encontrado.</Text>
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
                    <View style={[styles.badge, { backgroundColor: cores.accent }]}>
                      <Text style={styles.badgeText}>Familiar</Text>
                    </View>
                    <Text style={[styles.data, { color: cores.muted }]}>
                      {new Date(item.created_at).toLocaleDateString("pt-BR")}
                    </Text>
                  </View>
                </View>

                <View style={[styles.pacientesBox, { borderTopColor: cores.border }]}>
                  <Text style={[styles.pacientesTitulo, { color: cores.muted }]}>
                    Pacientes vinculados ({item.pacientes.length})
                  </Text>
                  {item.pacientes.length === 0 ? (
                    <Text style={[styles.pacienteVazio, { color: cores.muted }]}>
                      Nenhum paciente vinculado.
                    </Text>
                  ) : (
                    item.pacientes.map((p) => {
                      const detalhe = detalhePaciente(p);
                      return (
                        <View key={p.paciente_id} style={styles.pacienteRow}>
                          <Ionicons name="heart-outline" size={16} color={cores.primary} />
                          <Text style={[styles.pacienteNome, { color: cores.text }]} numberOfLines={1}>
                            {p.nome}
                          </Text>
                          {!!detalhe && (
                            <Text style={[styles.pacienteDetalhe, { color: cores.muted }]} numberOfLines={1}>
                              {detalhe}
                            </Text>
                          )}
                        </View>
                      );
                    })
                  )}
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
  pacientesBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  pacientesTitulo: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
  pacienteVazio: { fontSize: 12, fontStyle: "italic" },
  pacienteRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 3 },
  pacienteNome: { fontSize: 13, fontWeight: "600", flexShrink: 1 },
  pacienteDetalhe: { fontSize: 12, flexShrink: 1 },
});
