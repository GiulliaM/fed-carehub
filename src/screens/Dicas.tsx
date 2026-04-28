import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import api from "../config/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CATEGORIAS = [
  { label: "Todas", value: "" },
  { label: "Alzheimer", value: "Alzheimer" },
  { label: "Nutrição", value: "Nutrição" },
  { label: "Medicamentos", value: "Medicamentos" },
  { label: "Mobilidade", value: "Mobilidade" },
  { label: "Bem-estar", value: "Bem-estar" },
  { label: "Diabetes", value: "Diabetes" },
  { label: "Hipertensão", value: "Hipertensão" },
  { label: "Cuidados Paliativos", value: "Cuidados Paliativos" },
];

type Artigo = {
  artigo_id: number;
  titulo: string;
  subtitulo: string | null;
  categoria: string;
  nome_autor: string;
  foto_autor: string | null;
  imagem_url: string | null;
  visualizacoes: number;
  created_at: string;
};

function formatarData(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function CardDica({ item, cores, tf, onPress }: { item: Artigo; cores: any; tf: any; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: cores.card, borderColor: cores.border }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.categoryChip, { backgroundColor: cores.primary + "20" }]}>
            <Text style={[styles.categoryText, { color: cores.primary }]} numberOfLines={1}>
              {item.categoria}
            </Text>
          </View>
          {item.visualizacoes > 0 && (
            <View style={styles.viewsRow}>
              <Ionicons name="eye-outline" size={13} color={cores.muted} />
              <Text style={[styles.viewsText, { color: cores.muted }]}>{item.visualizacoes}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.cardTitulo, { color: cores.text, fontSize: tf(16) }]} numberOfLines={2}>
          {item.titulo}
        </Text>
        {item.subtitulo ? (
          <Text style={[styles.cardSubtitulo, { color: cores.muted, fontSize: tf(13) }]} numberOfLines={2}>
            {item.subtitulo}
          </Text>
        ) : null}

        <View style={[styles.cardFooter, { borderTopColor: cores.border }]}>
          <View style={styles.autorRow}>
            <View style={[styles.autorAvatar, { backgroundColor: cores.primary }]}>
              <Ionicons name="person" size={12} color="#fff" />
            </View>
            <Text style={[styles.autorNome, { color: cores.muted, fontSize: tf(12) }]} numberOfLines={1}>
              {item.nome_autor}
            </Text>
          </View>
          <Text style={[styles.dataText, { color: cores.muted, fontSize: tf(11) }]}>
            {formatarData(item.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Dicas({ navigation }: any) {
  const { cores, tf } = useTema();
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async (categoria = categoriaSelecionada) => {
    try {
      setCarregando(true);
      const params = categoria ? `?categoria=${encodeURIComponent(categoria)}` : "";
      const res = await api.get(`/artigos${params}`);
      setArtigos(Array.isArray(res.data) ? res.data : []);
    } catch {
      setArtigos([]);
    } finally {
      setCarregando(false);
    }
  }, [categoriaSelecionada]);

  useEffect(() => {
    carregar(categoriaSelecionada);
  }, [categoriaSelecionada]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregar(categoriaSelecionada);
    setRefreshing(false);
  }, [carregar, categoriaSelecionada]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={cores.primary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: cores.primary, fontSize: tf(20) }]}>Dicas de Saúde</Text>
          <Text style={[styles.headerSub, { color: cores.muted, fontSize: tf(12) }]}>
            Cuidando de quem você ama
          </Text>
        </View>
      </View>

      {/* Carrossel de categorias */}
      <View style={styles.carrosselWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carrosselContent}
        >
          {CATEGORIAS.map((cat) => {
            const ativa = categoriaSelecionada === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.catChip,
                  { borderColor: cores.primary },
                  ativa && { backgroundColor: cores.primary },
                ]}
                onPress={() => setCategoriaSelecionada(cat.value)}
              >
                <Text style={[styles.catChipText, { color: ativa ? "#fff" : cores.primary, fontSize: tf(13) }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {carregando ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={cores.primary} />
        </View>
      ) : artigos.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="bulb-outline" size={64} color={cores.muted} />
          <Text style={[styles.emptyText, { color: cores.muted, fontSize: tf(15) }]}>
            Nenhuma dica encontrada{categoriaSelecionada ? ` em "${categoriaSelecionada}"` : ""}.
          </Text>
        </View>
      ) : (
        <FlatList
          data={artigos}
          keyExtractor={(item) => String(item.artigo_id)}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[cores.primary]} tintColor={cores.primary} />
          }
          renderItem={({ item }) => (
            <CardDica
              item={item}
              cores={cores}
              tf={tf}
              onPress={() => navigation.navigate("Artigo", { artigo_id: item.artigo_id })}
            />
          )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontWeight: "700" },
  headerSub: { marginTop: 1 },
  carrosselWrapper: { paddingVertical: 12 },
  carrosselContent: { paddingHorizontal: 16, gap: 8 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  catChipText: { fontWeight: "600" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyText: { textAlign: "center", marginTop: 16 },
  lista: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  categoryChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  categoryText: { fontSize: 11, fontWeight: "700" },
  viewsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewsText: { fontSize: 12 },
  cardTitulo: { fontWeight: "700", lineHeight: 22, marginBottom: 6 },
  cardSubtitulo: { lineHeight: 18, marginBottom: 12 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
  autorRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  autorAvatar: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  autorNome: { flex: 1 },
  dataText: {},
});
