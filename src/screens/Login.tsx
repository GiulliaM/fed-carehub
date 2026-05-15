import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
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
          Alert.alert("Erro", "Dados de login inválidos. Tente novamente.");
          return;
        }

        try {
          const keysToRemove = ["usuario", "paciente", "token", "user"];
          await AsyncStorage.multiRemove(keysToRemove);
        } catch {
          // ignora erro ao limpar sessão anterior
        }

        await salvarToken(token);
        await AsyncStorage.setItem("usuario", JSON.stringify(userData));

        // Redirecionar para tela de carregando que carregará todos os dados
        navigation.reset({ index: 0, routes: [{ name: "CarregandoDados" }] });
      } else {
        Alert.alert("Erro", "Credenciais inválidas.");
      }
    } catch (error: any) {
      if (error.response) {
        Alert.alert("Erro", error.response.data?.message || "Credenciais inválidas.");
      } else if (error.request) {
        Alert.alert("Erro", "Não foi possível conectar ao servidor. Verifique sua conexão.");
      } else {
        Alert.alert("Erro", "Ocorreu um erro inesperado.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/logo_carehub.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: cores.primary }]}>CareHub</Text>
        </View>

        <Text style={[styles.title, { color: cores.primary }]}>Entrar</Text>

        <TextInput
          style={[styles.input, { backgroundColor: cores.inputBg, color: cores.inputText, borderColor: cores.border }]}
          placeholder="E-mail"
          placeholderTextColor={cores.inputPlaceholder}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        {/* Senha */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: cores.inputBg, color: cores.inputText, borderColor: cores.border }]}
            placeholder="Senha"
            placeholderTextColor={cores.inputPlaceholder}
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
              color={cores.muted}
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
            <ActivityIndicator color={cores.background} />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Cadastro")}>
          <Text style={[styles.link, { color: cores.primary }]}>
            Não tem uma conta? Cadastre-se
          </Text>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
