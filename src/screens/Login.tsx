import React, { useState } from "react";
import {
  View,
TextInput,
ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image
} from "react-native";
import { Text } from "../components/Text";
import { AnimatedPressable as TouchableOpacity } from "../components/AnimatedPressable";

import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import styles from "../style/loginStyle";
import { salvarToken } from "../utils/autenticacao";
import { API_URL } from "../config/api";

export default function Login({ navigation }: any) {
  const { cores } = useTema();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email || !senha) {
      showToast("Preencha o e-mail e a senha.", "warning");
      return;
    }

    try {
      setCarregando(true);

      const res = await axios.post(`${API_URL}/usuarios/login`, { email, senha });

      if (res.status === 200 && res.data.usuario && res.data.token) {
        const token = res.data.token;
        const userData = res.data.usuario;

        if (!userData.usuario_id) {
          showToast("Dados de login inválidos. Tente novamente.", "error");
          return;
        }

        try {
          await AsyncStorage.multiRemove(["usuario", "paciente", "token", "user"]);
        } catch {}

        await salvarToken(token);
        await AsyncStorage.setItem("usuario", JSON.stringify(userData));
        const destino = userData.tipo === "admin" ? "AbasAdmin" : "CarregandoDados";
        navigation.reset({ index: 0, routes: [{ name: destino }] });
      } else {
        showToast("Credenciais inválidas.", "error");
      }
    } catch (error: any) {
      if (error.response) {
        showToast(error.response.data?.message || "Credenciais inválidas.", "error");
      } else if (error.request) {
        showToast("Não foi possível conectar ao servidor. Verifique sua conexão.", "error", 4000);
      } else {
        showToast("Ocorreu um erro inesperado.", "error");
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
