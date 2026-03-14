import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import {
  notificacoesLembreteAtivas,
  setNotificacoesLembreteAtivas,
  configurarCanal,
  cancelarTodosLembretes,
} from "../utils/notificacoes";

export default function Configuracoes({ navigation }: any) {
  const { cores } = useTema();
  const [lembretesAtivo, setLembretesAtivo] = useState(true);

  const carregar = useCallback(async () => {
    const ativo = await notificacoesLembreteAtivas();
    setLembretesAtivo(ativo);
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const toggleLembretes = async (value: boolean) => {
    if (value) {
      const ok = await configurarCanal();
      if (!ok) {
        Alert.alert(
          "Permissão necessária",
          "Ative as notificações nas configurações do aparelho para receber lembretes."
        );
        return;
      }
    } else {
      await cancelarTodosLembretes();
    }
    await setNotificacoesLembreteAtivas(value);
    setLembretesAtivo(value);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={cores.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: cores.primary }]}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: cores.card }]}>
          <View style={styles.row}>
            <Ionicons name="notifications-outline" size={28} color={cores.primary} />
            <View style={styles.rowText}>
              <Text style={[styles.cardTitle, { color: cores.text }]}>Lembretes de tarefas</Text>
              <Text style={[styles.cardSub, { color: cores.muted }]}>
                Receber notificação no horário de cada tarefa agendada
              </Text>
            </View>
            <Switch
              value={lembretesAtivo}
              onValueChange={toggleLembretes}
              trackColor={{ false: "#ccc", true: cores.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: cores.card }]}>
          <Ionicons name="information-circle-outline" size={22} color={cores.muted} />
          <Text style={[styles.infoText, { color: cores.muted }]}>
            Para usar um som personalizado nos lembretes, coloque o arquivo em:{" "}
            <Text style={styles.path}>assets/sounds/notificacao.mp3</Text> (ou notificacao.wav). Veja o README na pasta assets/sounds.
          </Text>
        </View>
      </ScrollView>
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
    borderBottomColor: "#eee",
  },
  backBtn: { marginRight: 12, padding: 4 },
  title: { fontSize: 20, fontWeight: "700" },
  scroll: { padding: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center" },
  rowText: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  cardSub: { fontSize: 14, marginTop: 4 },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  path: { fontFamily: "monospace", fontWeight: "600" },
});
