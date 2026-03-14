import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import coresPadrao from "../config/cores";
import { useTema } from "../context/ThemeContext";
import { API_URL } from "../config/api";
import { obterToken } from "../utils/autenticacao";

export default function EditarUsuario({ route, navigation }: any) {
  const { cores } = useTema();
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  // Campos editáveis
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const userParam = route.params?.user;

  // Carregar dados do usuário
  useEffect(() => {
    if (userParam) {
      setUsuario(userParam);
      setNome(userParam.nome || "");
      setEmail(userParam.email || "");
      setTelefone(userParam.telefone || "");
      setCarregando(false);
    } else {
      carregarUsuario();
    }
  }, []);

  const carregarUsuario = async () => {
    try {
      const token = await obterToken();
      const res = await fetch(`${API_URL}/usuarios/perfil`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (res.ok) {
        setUsuario(json);
        setNome(json.nome || "");
        setEmail(json.email || "");
        setTelefone(json.telefone || "");
      } else {
        console.error(json);
        Alert.alert("Erro", "Falha ao carregar dados do usuário.");
      }
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
      Alert.alert("Erro", "Falha ao carregar dados do usuário.");
    } finally {
      setCarregando(false);
    }
  };

  // Salvar alterações
  const salvarAlteracoes = async () => {
    if (!usuario || !usuario.usuario_id)
      return Alert.alert("Erro", "Usuário inválido.");

    if (!nome.trim() || !email.trim())
      return Alert.alert("Erro", "Preencha nome e e-mail.");

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
        console.error(json);
        return Alert.alert("Erro", json.message || "Erro ao atualizar usuário.");
      }

      Alert.alert("Sucesso", "Informações atualizadas com sucesso!");
      navigation.goBack();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      Alert.alert("Erro", "Falha ao conectar com o servidor.");
    }
  };

  // Tela de carregando
  if (carregando) {
    return (
      <View style={styles.carregandoContainer}>
        <ActivityIndicator size="large" color={cores.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: cores.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: cores.primary }]}>
          Editar Informações do Usuário
        </Text>

        {/* Nome */}
        <TextInput
          placeholder="Nome"
          value={nome}
          onChangeText={setNome}
          style={styles.input}
        />

        {/* E-mail */}
        <TextInput
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        {/* Telefone */}
        <TextInput
          placeholder="Telefone (ex: 11 98765-4321)"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
          style={styles.input}
        />

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: cores.primary }]}
          onPress={salvarAlteracoes}
        >
          <Text style={styles.btnText}>Salvar Alterações</Text>
        </TouchableOpacity>

        {/* Botão Cancelar */}
        <TouchableOpacity
          style={styles.btnSecundario}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnSecText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos 
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: coresPadrao.background },
  container: { flexGrow: 1, padding: 16, justifyContent: "center" },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  btn: {
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnSecundario: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: coresPadrao.primary,
    marginTop: 12,
    alignItems: "center",
  },
  btnSecText: {
    color: coresPadrao.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  carregandoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
