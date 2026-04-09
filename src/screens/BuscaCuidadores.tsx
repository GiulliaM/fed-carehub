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
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import api from "../config/api";

type CuidadorItem = {
  id: number;
  usuario_id: number;
  nome: string;
  bio: string | null;
  especialidades: string[];
  preco_hora: number | null;
  cidade: string | null;
  bairro: string | null;
  foto_url: string | null;
  telefone: string | null;
};

function formatarTelefoneWhatsApp(t: string | null): string | null {
  if (!t || !t.trim()) return null;
  const digits = t.replace(/\D/g, "");
  if (digits.length >= 10) {
    return "55" + digits;
  }
  return null;
}

function CardCuidador({
  item,
  cores,
}: {
  item: CuidadorItem;
  cores: Record<string, string>;
}) {
  const whatsapp = formatarTelefoneWhatsApp(item.telefone);
  const abrirWhatsApp = () => {
    if (whatsapp) {
      const url = `https://wa.me/${whatsapp}`;
      Linking.openURL(url).catch(() =>
        Alert.alert("Erro", "Não foi possível abrir o WhatsApp.")
      );
    } else {
      Alert.alert(
        "Contato",
        "Este cuidador ainda não informou o telefone para WhatsApp."
      );
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: cores.card }]}>
      <View style={styles.cardTop}>
        {item.foto_url ? (
          <Image source={{ uri: item.foto_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: cores.primary }]}>
            <Ionicons name="person" size={36} color="#fff" />
          </View>
        )}
        <View style={styles.cardHeader}>
          <Text style={[styles.nome, { color: cores.text }]} numberOfLines={1}>
            {item.nome}
          </Text>
          {(item.cidade || item.bairro) && (
            <Text style={[styles.local, { color: cores.muted }]} numberOfLines={1}>
              {[item.bairro, item.cidade].filter(Boolean).join(", ")}
            </Text>
          )}
          {item.preco_hora != null && (
            <Text style={[styles.preco, { color: cores.primary }]}>
              R$ {Number(item.preco_hora).toFixed(2)}/hora
            </Text>
          )}
        </View>
      </View>
      {Array.isArray(item.especialidades) && item.especialidades.length > 0 && (
        <View style={styles.tagsRow}>
          {item.especialidades.slice(0, 4).map((e) => (
            <View key={e} style={[styles.tag, { backgroundColor: cores.primary + "20" }]}>
              <Text style={[styles.tagText, { color: cores.primary }]} numberOfLines={1}>
                {e}
              </Text>
            </View>
          ))}
        </View>
      )}
      {item.bio ? (
        <Text style={[styles.bio, { color: cores.text }]} numberOfLines={3}>
          {item.bio}
        </Text>
      ) : null}
      <TouchableOpacity
        style={[styles.btnContato, { backgroundColor: "#25D366" }]}
        onPress={abrirWhatsApp}
      >
        <Ionicons name="logo-whatsapp" size={22} color="#fff" />
        <Text style={styles.btnContatoText}>Entrar em contato</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BuscaCuidadores({ navigation }: any) {
  const { cores } = useTema();
  const [especialidade, setEspecialidade] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [lista, setLista] = useState<CuidadorItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [buscou, setBuscou] = useState(false);

  const buscar = useCallback(async () => {
    try {
      setCarregando(true);
      setBuscou(true);
      const params = new URLSearchParams();
      if (especialidade.trim()) params.set("especialidade", especialidade.trim());
      if (cidade.trim()) params.set("cidade", cidade.trim());
      if (bairro.trim()) params.set("bairro", bairro.trim());
      const query = params.toString();
      const res = await api.get("/cuidadores/busca" + (query ? "?" + query : ""));
      setLista(Array.isArray(res) ? res : []);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        Alert.alert("Acesso negado", "Esta área é para familiares.");
        navigation.goBack();
        return;
      }
      Alert.alert("Erro", "Não foi possível buscar cuidadores.");
      setLista([]);
    } finally {
      setCarregando(false);
    }
  }, [especialidade, cidade, bairro, navigation]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={cores.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: cores.primary }]}>Buscar Cuidadores</Text>
      </View>

      <View style={[styles.filters, { backgroundColor: cores.card }]}>
        <TextInput
          style={[styles.input, { color: cores.text, borderColor: cores.muted }]}
          placeholder="Especialidade (ex: Alzheimer)"
          placeholderTextColor={cores.muted}
          value={especialidade}
          onChangeText={setEspecialidade}
        />
        <TextInput
          style={[styles.input, { color: cores.text, borderColor: cores.muted }]}
          placeholder="Cidade"
          placeholderTextColor={cores.muted}
          value={cidade}
          onChangeText={setCidade}
        />
        <TextInput
          style={[styles.input, { color: cores.text, borderColor: cores.muted }]}
          placeholder="Bairro"
          placeholderTextColor={cores.muted}
          value={bairro}
          onChangeText={setBairro}
        />
        <TouchableOpacity
          style={[styles.btnBuscar, { backgroundColor: cores.primary }]}
          onPress={buscar}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.btnBuscarText}>Buscar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {buscou && !carregando && (
        <>
          {lista.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={64} color={cores.muted} />
              <Text style={[styles.emptyText, { color: cores.muted }]}>
                Nenhum cuidador encontrado com esses filtros.
              </Text>
            </View>
          ) : (
            <FlatList
              data={lista}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => <CardCuidador item={item} cores={cores} />}
            />
          )}
        </>
      )}

      {!buscou && !carregando && (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={64} color={cores.muted} />
          <Text style={[styles.emptyText, { color: cores.muted }]}>
            Use os filtros acima e clique em Buscar para encontrar cuidadores.
          </Text>
        </View>
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
    borderBottomColor: "#eee",
  },
  backBtn: { marginRight: 12, padding: 4 },
  title: { fontSize: 20, fontWeight: "700" },
  filters: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  btnBuscar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  btnBuscarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  cardHeader: { flex: 1, marginLeft: 12 },
  nome: { fontSize: 18, fontWeight: "700" },
  local: { fontSize: 14, marginTop: 2 },
  preco: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 12 },
  bio: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  btnContato: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnContatoText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyText: { textAlign: "center", fontSize: 16, marginTop: 16 },
});
