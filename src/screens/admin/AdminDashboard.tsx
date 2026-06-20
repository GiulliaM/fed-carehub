import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Text } from "../../components/Text";
import { AnimatedPressable as TouchableOpacity } from "../../components/AnimatedPressable";
import { useTema } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import api from "../../config/api";
import { sair } from "../../utils/autenticacao";

type Stats = {
  total_usuarios: number;
  total_familiares: number;
  total_cuidadores: number;
  total_pacientes: number;
  pendentes: number;
  aprovados: number;
  rejeitados: number;
};

export default function AdminDashboard({ navigation }: any) {
  const { cores } = useTema();
  const { showToast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch {
      showToast("Erro ao carregar estatísticas.", "error");
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setCarregando(true); carregar(); }, [carregar]));

  const onRefresh = () => { setRefreshing(true); carregar(); };

  const handleSair = async () => {
    await sair();
    navigation.reset({ index: 0, routes: [{ name: "BoasVindas" }] });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <View>
          <Text style={[styles.titulo, { color: cores.primary }]}>Painel Admin</Text>
          <Text style={[styles.subtitulo, { color: cores.muted }]}>CareHub</Text>
        </View>
        <TouchableOpacity onPress={handleSair} style={styles.sairBtn}>
          <Feather name="log-out" size={22} color={cores.danger} />
        </TouchableOpacity>
      </View>

      {carregando ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={cores.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[cores.primary]} tintColor={cores.primary} />}
        >
          <Text style={[styles.secaoTitulo, { color: cores.text }]}>Usuários</Text>
          <View style={styles.row}>
            <CardMetrica
              label="Total"
              valor={stats?.total_usuarios ?? 0}
              icone="users"
              cor={cores.primary}
              cores={cores}
            />
            <CardMetrica
              label="Familiares"
              valor={stats?.total_familiares ?? 0}
              icone="heart"
              cor={cores.accent}
              cores={cores}
            />
          </View>
          <View style={styles.row}>
            <CardMetrica
              label="Cuidadores"
              valor={stats?.total_cuidadores ?? 0}
              icone="user-check"
              cor={cores.primary}
              cores={cores}
            />
            <CardMetrica
              label="Pacientes"
              valor={stats?.total_pacientes ?? 0}
              icone="user"
              cor={cores.success}
              cores={cores}
            />
          </View>

          <Text style={[styles.secaoTitulo, { color: cores.text }]}>Validações de Cuidadores</Text>
          <View style={styles.row}>
            <CardMetrica
              label="Pendentes"
              valor={stats?.pendentes ?? 0}
              icone="clock"
              cor={cores.warning}
              cores={cores}
            />
            <CardMetrica
              label="Aprovados"
              valor={stats?.aprovados ?? 0}
              icone="check-circle"
              cor={cores.success}
              cores={cores}
            />
            <CardMetrica
              label="Rejeitados"
              valor={stats?.rejeitados ?? 0}
              icone="x-circle"
              cor={cores.danger}
              cores={cores}
            />
          </View>

          {(stats?.pendentes ?? 0) > 0 && (
            <TouchableOpacity
              style={[styles.btnPendentes, { backgroundColor: cores.warning }]}
              onPress={() => navigation.navigate("Cuidadores")}
            >
              <Feather name="alert-circle" size={20} color="#fff" />
              <Text style={styles.btnPendentesText}>
                Revisar {stats?.pendentes} perfil{stats?.pendentes !== 1 ? "s" : ""} pendente{stats?.pendentes !== 1 ? "s" : ""}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function CardMetrica({
  label,
  valor,
  icone,
  cor,
  cores,
}: {
  label: string;
  valor: number;
  icone: any;
  cor: string;
  cores: Record<string, string>;
}) {
  return (
    <View style={[styles.card, { backgroundColor: cores.card, borderColor: cores.border }]}>
      <View style={[styles.cardIcone, { backgroundColor: cor + "20" }]}>
        <Feather name={icone} size={22} color={cor} />
      </View>
      <Text style={[styles.cardValor, { color: cores.text }]}>{valor}</Text>
      <Text style={[styles.cardLabel, { color: cores.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titulo: { fontSize: 22, fontWeight: "700" },
  subtitulo: { fontSize: 13 },
  sairBtn: { padding: 8 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 20, gap: 12 },
  secaoTitulo: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  row: { flexDirection: "row", gap: 10 },
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardValor: { fontSize: 24, fontWeight: "700" },
  cardLabel: { fontSize: 12, marginTop: 2, textAlign: "center" },
  btnPendentes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  btnPendentesText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
