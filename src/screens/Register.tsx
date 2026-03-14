import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import coresPadrao from "../config/cores";
import { useTema } from '../context/ThemeContext';
import { API_URL } from "../config/api";
import { salvarToken, salvarDadosUsuario } from "../utils/autenticacao";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Register({ navigation }: any) {
  const { cores } = useTema();
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState("familiar");
  const [nomePaciente, setNomePaciente] = useState("");
  const [idadePaciente, setIdadePaciente] = useState("");

  const cadastrarCompleto = async () => {
    if (!nome || !email || !senha || !nomePaciente) {
      Alert.alert("Campos obrigatórios", "Preencha todos os campos do usuário e do paciente.");
      return;
    }
    try {
      // 1. Cadastrar usuário
      const res = await fetch(`${API_URL}/usuarios/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, tipo }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Exibe a mensagem de erro exata que o backend enviou
        return Alert.alert("Erro no cadastro", json.message || json.detail || `Erro ${res.status}`);
      }

      // backend retorna: { usuario: { usuario_id, nome, email, tipo }, token }
      const token = json.token;
      const usuario_id = json.usuario?.usuario_id;

      if (!token || !usuario_id) {
        return Alert.alert("Erro", "Resposta inesperada do servidor. Tente novamente.");
      }

      await salvarToken(token);
      await salvarDadosUsuario({ usuario_id, nome: json.usuario?.nome || nome, tipo: json.usuario?.tipo || tipo });

      // 2. Cadastrar paciente vinculado
      const resPac = await fetch(`${API_URL}/pacientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nome: nomePaciente, idade: idadePaciente || null }),
      });
      const jsonPac = await resPac.json();
      if (!resPac.ok) {
        return Alert.alert("Erro ao criar paciente", jsonPac.message || `Erro ${resPac.status}`);
      }

      await AsyncStorage.setItem(
        "paciente",
        JSON.stringify({ paciente_id: jsonPac.paciente_id, nome: nomePaciente, idade: idadePaciente })
      );

      // 3. Ir para o app
      navigation.reset({ index: 0, routes: [{ name: "Abas" }] });
    } catch (err) {
      console.error("[Register] Erro:", err);
      Alert.alert("Erro de conexão", "Não foi possível conectar ao servidor. Verifique sua internet.");
    }
  };

  if (step === 1) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.background }]}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Cadastrar Usuário</Text>
          <TextInput
            placeholder="Nome"
            value={nome}
            onChangeText={setNome}
            style={styles.input}
          />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            style={styles.input}
          />
          <TouchableOpacity style={styles.btn} onPress={() => setStep(2)}>
            <Text style={styles.btnText}>Próximo</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }
  // Etapa 2: Cadastro do paciente
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: cores.primary }]}>Cadastrar Paciente Vinculado</Text>
        <TextInput
          placeholder="Nome do paciente"
          value={nomePaciente}
          onChangeText={setNomePaciente}
          style={styles.input}
        />
        <TextInput
          placeholder="Idade"
          value={idadePaciente}
          onChangeText={setIdadePaciente}
          keyboardType="numeric"
          style={styles.input}
        />
        <TouchableOpacity style={styles.btn} onPress={cadastrarCompleto}>
          <Text style={styles.btnText}>Finalizar Cadastro</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: coresPadrao.background },
  container: { flexGrow: 1, padding: 16, justifyContent: "center" },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: coresPadrao.primary,
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
  },
  btn: {
    backgroundColor: coresPadrao.primary,
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  linkWrap: { alignItems: "center", marginTop: 12 },
  link: { color: coresPadrao.primary, fontWeight: "600" },
});
