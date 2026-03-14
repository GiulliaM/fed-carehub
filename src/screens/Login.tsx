import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import styles from "../style/loginStyle";
import { salvarToken } from "../utils/autenticacao";
import { API_URL } from "../config/api";

export default function Login({ navigation }: any) {
  const { cores } = useTema();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email || !senha) {
      Alert.alert("Campos obrigatórios", "Preencha o e-mail e a senha.");
      return;
    }

    try {
      setCarregando(true);

      const res = await axios.post(`${API_URL}/usuarios/login`, {
        email,
        senha,
      });

      // Agora o backend SEMPRE retorna: { usuario: {...}, token }
      if (res.status === 200 && res.data.usuario && res.data.token) {
        const token = res.data.token;
        const userData = res.data.usuario;

        // Validar que userData tem usuario_id
        if (!userData.usuario_id) {
          console.error("❌ Resposta do servidor sem usuario_id:", userData);
          Alert.alert("Erro", "Dados de login inválidos. Tente novamente.");
          return;
        }

        try {
          const keysToRemove = ["usuario", "paciente", "token", "user"];
          console.log("Clearing old session keys");
          await AsyncStorage.multiRemove(keysToRemove);
        } catch (e) {
          console.log("Error clearing AsyncStorage:", e);
        }

        // Salva novos dados do usuário
        await salvarToken(token);
        await AsyncStorage.setItem("usuario", JSON.stringify(userData));

        console.log("Login successful:", userData.nome);

        // Redirecionar para tela de carregando que carregará todos os dados
        navigation.reset({ index: 0, routes: [{ name: "CarregandoDados" }] });
      } else {
        Alert.alert("Erro", "Credenciais inválidas.");
      }
    } catch (error: any) {
      console.log("Login error:", error);
      if (error.response) {
        console.log("Server response:", error.response.data);
        Alert.alert("Erro", error.response.data?.message || "Credenciais inválidas.");
      } else if (error.request) {
        console.log("No server response");
        Alert.alert("Erro", "Não foi possível conectar ao servidor. Verifique sua conexão.");
      } else {
        console.log("Error:", error.message);
        Alert.alert("Erro", "Ocorreu um erro inesperado.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Text style={[styles.title, { color: cores.primary }]}>Entrar</Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#999"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        {/* Senha */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Senha"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            value={senha}
            onChangeText={setSenha}
          />

          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Botão */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: cores.primary }]}
          onPress={handleLogin}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Cadastro")}>
          <Text style={[styles.link, { color: cores.primary }]}>
            Não tem uma conta? Cadastre-se
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
