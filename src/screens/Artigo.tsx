import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import api from "../config/api";

export default function Artigo({ route, navigation }: any) {
  const { cores, tf } = useTema();
  const { artigo_id } = route.params;

  const [artigo, setArtigo] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setCarregando(true);
    api
      .get(`/artigos/${artigo_id}`)
      .then((res) => setArtigo(res.data))
      .catch(() => setErro("Não foi possível carregar o artigo."))
      .finally(() => setCarregando(false));
  }, [artigo_id]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      <View style={[styles.topBar, { borderBottomColor: cores.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={cores.primary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: cores.text, fontSize: tf(16) }]} numberOfLines={1}>
          {artigo?.titulo || "Artigo"}
        </Text>
      </View>

      {carregando && (
        <ActivityIndicator size="large" color={cores.primary} style={{ marginTop: 40 }} />
      )}

      {!carregando && erro && (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={cores.danger} />
          <Text style={[styles.erroText, { color: cores.danger, fontSize: tf(14) }]}>{erro}</Text>
        </View>
      )}

      {!carregando && artigo && (
        <ScrollView contentContainerStyle={styles.body}>
          {artigo.categoria && (
            <View style={[styles.chip, { backgroundColor: cores.primary }]}>
              <Text style={{ color: "#fff", fontSize: tf(11), fontWeight: "700" }}>
                {artigo.categoria}
              </Text>
            </View>
          )}
          <Text style={[styles.titulo, { color: cores.text, fontSize: tf(22) }]}>
            {artigo.titulo}
          </Text>
          <View style={[styles.divider, { backgroundColor: cores.border }]} />
          <Text style={[styles.conteudo, { color: cores.text, fontSize: tf(15) }]}>
            {artigo.conteudo}
          </Text>

          {artigo.fonte_url ? (
            <TouchableOpacity
              style={[styles.fonteBtn, { borderColor: cores.border, backgroundColor: cores.card }]}
              onPress={() => Linking.openURL(artigo.fonte_url)}
              activeOpacity={0.7}
            >
              <Ionicons name="open-outline" size={16} color={cores.primary} />
              <Text style={[styles.fonteTexto, { color: cores.primary, fontSize: tf(13) }]}>
                Ver fonte original
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  topTitle: { flex: 1, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  erroText: { textAlign: "center" },
  body: { padding: 20, paddingBottom: 40 },
  chip: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  titulo: { fontWeight: "700", lineHeight: 30, marginBottom: 12 },
  divider: { height: 1, marginBottom: 16 },
  conteudo: { lineHeight: 24 },
  fonteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 28,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  fonteTexto: { fontWeight: "600" },
});
