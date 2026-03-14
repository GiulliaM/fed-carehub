import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import coresPadrao from "../config/cores";
import { salvarToken } from '../utils/autenticacao';
import { useTema } from '../context/ThemeContext';

export default function Cadastro({ navigation }: any) {
  const { cores } = useTema();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState<"familiar" | "cuidador" | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleCadastro() {
    if (!nome || !email || !senha || !tipo) {
      Alert.alert("Campos obrigatórios", "Preencha todos os campos.");
      return;
    }

    try {
      setCarregando(true);
      const res = await axios.post(`${API_URL}/usuarios/cadastro`, {
        nome,
        email,
        senha,
        tipo,
      });

      if (res.status === 201) {
        // backend retorna: { usuario: { usuario_id, nome, email, tipo }, token }
        const token = res.data?.token;
        const usuario_id = res.data?.usuario?.usuario_id;

        if (!token || !usuario_id) {
          // Resposta inesperada — mas cadastro pode ter funcionado, vai para login
          Alert.alert("Sucesso", "Cadastro realizado! Faça login para continuar.");
          navigation.navigate("Login");
          return;
        }

        await salvarToken(token);
        const userData = {
          usuario_id,
          nome: res.data?.usuario?.nome || nome,
          email: res.data?.usuario?.email || email,
          tipo: res.data?.usuario?.tipo || tipo,
        };
        await AsyncStorage.setItem("usuario", JSON.stringify(userData));
        console.log("Cadastro concluido:", userData);
        navigation.reset({ index: 0, routes: [{ name: "Abas" }] });
      }
    } catch (err: any) {
      console.error("[Cadastro] Erro:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        (err?.response?.status === 409 ? "Este e-mail já está cadastrado." : null) ||
        "Não foi possível realizar o cadastro. Verifique sua conexão.";
      Alert.alert("Erro no cadastro", msg);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: cores.primary }]}>Crie sua conta</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome completo"
          placeholderTextColor="#999"
          value={nome}
          onChangeText={setNome}
        />

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#999"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <Text style={styles.label}>Tipo de usuário:</Text>

        <View style={styles.tipoContainer}>
          <TouchableOpacity
            style={[styles.tipoBtn, tipo === "familiar" && styles.tipoSelecionado]}
            onPress={() => setTipo("familiar")}
          >
            <Text
              style={[
                styles.tipoText,
                tipo === "familiar" && styles.tipoTextSelecionado,
              ]}
            >
              Familiar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tipoBtn, tipo === "cuidador" && styles.tipoSelecionado]}
            onPress={() => setTipo("cuidador")}
          >
            <Text
              style={[
                styles.tipoText,
                tipo === "cuidador" && styles.tipoTextSelecionado,
              ]}
            >
              Cuidador
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btnCadastrar, { backgroundColor: cores.primary }]}
          onPress={handleCadastro}
          disabled={carregando}
        >
          <Text style={styles.btnText}>
            {carregando ? "Cadastrando..." : "Cadastrar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginText}>
            Já possui uma conta? <Text style={styles.link}>Entrar</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: coresPadrao.background,
  },
  title: {
    fontSize: 26,
    color: coresPadrao.primary,
    fontWeight: "700",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: "#000",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  label: {
    width: "100%",
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    fontWeight: "600",
  },
  tipoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  tipoBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: coresPadrao.primary,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  tipoSelecionado: {
    backgroundColor: coresPadrao.primary,
  },
  tipoText: {
    color: coresPadrao.primary,
    fontWeight: "600",
  },
  tipoTextSelecionado: {
    color: "#fff",
  },
  btnCadastrar: {
    backgroundColor: coresPadrao.primary,
    padding: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  loginText: {
    color: "#555",
    marginTop: 16,
  },
  link: {
    color: coresPadrao.primary,
    fontWeight: "600",
  },
});
