import React, { useState } from "react";
import {
  View,
TextInput,
StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image
} from "react-native";
import { Text } from "../components/Text";
import { AnimatedPressable as TouchableOpacity } from "../components/AnimatedPressable";

import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import { salvarToken } from "../utils/autenticacao";
import { useTema } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

export default function Cadastro({ navigation }: any) {
  const { cores, tf } = useTema();
  const { showToast } = useToast();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState<"familiar" | "cuidador" | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleCadastro() {
    if (!nome || !email || !senha || !tipo) {
      showToast("Preencha todos os campos.", "warning");
      return;
    }

    try {
      setCarregando(true);
      const res = await axios.post(`${API_URL}/usuarios/cadastro`, { nome, email, senha, tipo });

      if (res.status === 201) {
        const token = res.data?.token;
        const usuario_id = res.data?.usuario?.usuario_id;

        if (!token || !usuario_id) {
          showToast("Cadastro realizado! Faça login para continuar.", "success");
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

        if ((res.data?.usuario?.tipo || tipo) === "familiar") {
          navigation.reset({ index: 0, routes: [{ name: "CadastrarPaciente", params: { primeiroAcesso: true } }] });
        } else {
          // cuidador novo completa o perfil e segue pra analise (nao cai nas Abas ainda)
          navigation.reset({
            index: 0,
            routes: [{ name: "PerfilCuidador", params: { primeiroAcesso: true } }],
          });
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        (err?.response?.status === 409 ? "Este e-mail já está cadastrado." : null) ||
        "Não foi possível realizar o cadastro. Verifique sua conexão.";
      showToast(msg, "error", 4000);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/logo_carehub.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.appName, { color: cores.primary }]}>CareHub</Text>
          </View>

          <Text style={[styles.title, { color: cores.primary, fontSize: tf(26) }]}>
            Crie sua conta
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: cores.inputBg,
                color: cores.inputText,
                borderColor: cores.border,
                fontSize: tf(16),
              },
            ]}
            placeholder="Nome completo"
            placeholderTextColor={cores.inputPlaceholder}
            value={nome}
            onChangeText={setNome}
          />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: cores.inputBg,
                color: cores.inputText,
                borderColor: cores.border,
                fontSize: tf(16),
              },
            ]}
            placeholder="E-mail"
            placeholderTextColor={cores.inputPlaceholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: cores.inputBg,
                color: cores.inputText,
                borderColor: cores.border,
                fontSize: tf(16),
              },
            ]}
            placeholder="Senha"
            placeholderTextColor={cores.inputPlaceholder}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />

          <Text style={[styles.label, { color: cores.text, fontSize: tf(15) }]}>
            Tipo de usuário:
          </Text>

          <View style={styles.tipoContainer}>
            {(["familiar", "cuidador"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.tipoBtn,
                  { borderColor: cores.primary },
                  tipo === t && { backgroundColor: cores.primary },
                ]}
                onPress={() => setTipo(t)}
              >
                <Text
                  style={[
                    styles.tipoBtnText,
                    { color: tipo === t ? "#fff" : cores.primary, fontSize: tf(15) },
                  ]}
                >
                  {t === "familiar" ? "Familiar" : "Cuidador"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btnCadastrar, { backgroundColor: cores.primary }]}
            onPress={handleCadastro}
            disabled={carregando}
          >
            <Text style={[styles.btnText, { fontSize: tf(16) }]}>
              {carregando ? "Cadastrando..." : "Cadastrar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={[styles.loginText, { color: cores.muted, fontSize: tf(14) }]}>
              Já possui uma conta?{" "}
              <Text style={{ color: cores.primary, fontWeight: "600" }}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: { fontWeight: "700", marginBottom: 24 },
  input: {
    width: "100%",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  label: { width: "100%", marginBottom: 8, fontWeight: "600" },
  tipoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
    gap: 10,
  },
  tipoBtn: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  tipoBtnText: { fontWeight: "600" },
  btnCadastrar: {
    padding: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  loginText: { marginTop: 16 },
  logoContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 22,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    marginTop: 8,
    letterSpacing: 1,
  },
});