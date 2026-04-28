import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTema } from "../context/ThemeContext";
import { API_URL } from "../config/api";
import { obterToken } from "../utils/autenticacao";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EditarUsuario({ route, navigation }: any) {
  const { cores, tf } = useTema();
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [uploadandoFoto, setUploadandoFoto] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");

  const userParam = route.params?.user;

  useEffect(() => {
    if (userParam) {
      setUsuario(userParam);
      setNome(userParam.nome || "");
      setEmail(userParam.email || "");
      setTelefone(userParam.telefone || "");
      setFotoUrl(userParam.foto_url || "");
      setCarregando(false);
    } else {
      carregarUsuario();
    }
  }, []);

  const carregarUsuario = async () => {
    try {
      const raw = await AsyncStorage.getItem("usuario");
      const u = raw ? JSON.parse(raw) : null;
      if (u) {
        setUsuario(u);
        setNome(u.nome || "");
        setEmail(u.email || "");
        setTelefone(u.telefone || "");
        setFotoUrl(u.foto_url || "");
      } else {
        Alert.alert("Erro", "Faça login novamente para editar seu perfil.");
      }
    } catch {
      Alert.alert("Erro", "Falha ao carregar dados do usuário.");
    } finally {
      setCarregando(false);
    }
  };

  const escolherFoto = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de acesso à sua galeria para alterar a foto."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadFoto(result.assets[0].uri);
    }
  };

  const uploadFoto = async (uri: string) => {
    if (!usuario?.usuario_id) return;
    setUploadandoFoto(true);
    try {
      const token = await obterToken();
      const filename = uri.split("/").pop() || "foto.jpg";
      const ext = filename.split(".").pop() || "jpeg";
      const type = `image/${ext}`;

      const formData = new FormData();
      formData.append("foto", { uri, name: filename, type } as any);

      const res = await fetch(`${API_URL}/usuarios/${usuario.usuario_id}/foto`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();
      if (res.ok) {
        const novaUrl = json.foto_url || uri;
        setFotoUrl(novaUrl);
        const raw = await AsyncStorage.getItem("usuario");
        const stored = raw ? JSON.parse(raw) : {};
        await AsyncStorage.setItem(
          "usuario",
          JSON.stringify({ ...stored, foto_url: novaUrl })
        );
        Alert.alert("Sucesso", "Foto de perfil atualizada!");
      } else {
        Alert.alert("Erro", json.message || "Não foi possível salvar a foto.");
      }
    } catch {
      Alert.alert("Erro", "Falha ao enviar a foto. Verifique sua conexão.");
    } finally {
      setUploadandoFoto(false);
    }
  };

  const salvarAlteracoes = async () => {
    if (!usuario || !usuario.usuario_id)
      return Alert.alert("Erro", "Usuário inválido.");

    if (!nome.trim() || !email.trim())
      return Alert.alert("Erro", "Preencha nome e e-mail.");

    setSalvando(true);
    try {
      const token = await obterToken();
      const res = await fetch(`${API_URL}/usuarios/${usuario.usuario_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome,
          email,
          telefone: telefone.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        return Alert.alert("Erro", json.message || "Erro ao atualizar usuário.");
      }

      const raw = await AsyncStorage.getItem("usuario");
      const storedUser = raw ? JSON.parse(raw) : {};
      await AsyncStorage.setItem(
        "usuario",
        JSON.stringify({
          ...storedUser,
          nome,
          email,
          telefone: telefone.trim() || null,
        })
      );

      Alert.alert("Sucesso", "Informações atualizadas com sucesso!");
      navigation.goBack();
    } catch {
      Alert.alert("Erro", "Falha ao conectar com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <View style={[styles.centered, { backgroundColor: cores.background }]}>
        <ActivityIndicator size="large" color={cores.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: cores.primary, fontSize: tf(22) }]}>
            Editar Perfil
          </Text>

          {/* Avatar */}
          <View style={styles.avatarArea}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={escolherFoto}
              disabled={uploadandoFoto}
            >
              {fotoUrl ? (
                <Image source={{ uri: fotoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: cores.border }]}>
                  <Ionicons name="person-outline" size={42} color={cores.muted} />
                </View>
              )}
              <View style={[styles.avatarBadge, { backgroundColor: cores.primary }]}>
                {uploadandoFoto ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={14} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            <Text style={[styles.avatarHint, { color: cores.muted, fontSize: tf(13) }]}>
              Toque para alterar a foto
            </Text>
          </View>

          {/* Campos */}
          <View style={[styles.card, { backgroundColor: cores.card, borderColor: cores.border }]}>
            <Text style={[styles.label, { color: cores.text, fontSize: tf(13) }]}>Nome</Text>
            <TextInput
              placeholder="Nome completo"
              placeholderTextColor={cores.inputPlaceholder}
              value={nome}
              onChangeText={setNome}
              style={[
                styles.input,
                {
                  backgroundColor: cores.inputBg,
                  color: cores.inputText,
                  borderColor: cores.border,
                  fontSize: tf(15),
                },
              ]}
            />

            <Text style={[styles.label, { color: cores.text, fontSize: tf(13) }]}>E-mail</Text>
            <TextInput
              placeholder="E-mail"
              placeholderTextColor={cores.inputPlaceholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  backgroundColor: cores.inputBg,
                  color: cores.inputText,
                  borderColor: cores.border,
                  fontSize: tf(15),
                },
              ]}
            />

            <Text style={[styles.label, { color: cores.text, fontSize: tf(13) }]}>
              Telefone
            </Text>
            <TextInput
              placeholder="(11) 98765-4321"
              placeholderTextColor={cores.inputPlaceholder}
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
              style={[
                styles.input,
                {
                  backgroundColor: cores.inputBg,
                  color: cores.inputText,
                  borderColor: cores.border,
                  fontSize: tf(15),
                  marginBottom: 0,
                },
              ]}
            />
          </View>

          <TouchableOpacity
            style={[styles.btnSalvar, { backgroundColor: cores.primary }]}
            onPress={salvarAlteracoes}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.btnSalvarText, { fontSize: tf(16) }]}>
                Salvar Alterações
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnCancelar, { borderColor: cores.border }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.btnCancelarText, { color: cores.muted, fontSize: tf(15) }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flexGrow: 1, padding: 16, paddingBottom: 40 },
  title: {
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  avatarArea: { alignItems: "center", marginBottom: 24 },
  avatarWrapper: { position: "relative", marginBottom: 8 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: { marginTop: 4 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 6,
  },
  label: { fontWeight: "600", marginTop: 6 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  btnSalvar: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  btnSalvarText: { color: "#fff", fontWeight: "700" },
  btnCancelar: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  btnCancelarText: { fontWeight: "600" },
});