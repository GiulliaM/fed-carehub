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
import { useTema } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import { obterToken } from "../utils/autenticacao";

export default function CadastrarPaciente({ navigation }: any) {
  const { cores } = useTema();

  // Campos do paciente
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [genero, setGenero] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const cadastrar = async () => {
    if (!nome) return Alert.alert("Erro", "Informe o nome do paciente.");

    try {
      const token = await obterToken();
      const res = await fetch(`${API_URL}/pacientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome,
          idade: idade || null,
          genero: genero || null,
          observacoes: observacoes || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        console.error(json);
        return Alert.alert("Erro", json.message || "Erro ao cadastrar paciente.");
      }

      // Salva o paciente no AsyncStorage (para acesso rápido)
      try {
        await AsyncStorage.setItem(
          "paciente",
          JSON.stringify({
            paciente_id: json.paciente_id,
            nome,
            idade,
            genero,
            observacoes,
          })
        );
      } catch (e) {
        console.warn("Falha ao salvar paciente localmente:", e);
      }

      Alert.alert("Sucesso", "Paciente cadastrado com sucesso!");
      navigation.reset({ index: 0, routes: [{ name: "Abas" }] });
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao conectar com o servidor.");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: cores.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: cores.primary }]}>
          Cadastrar Paciente
        </Text>

        {/* Nome */}
        <TextInput
          placeholder="Nome do paciente"
          value={nome}
          onChangeText={setNome}
          style={styles.input}
        />

        {/* Idade */}
        <TextInput
          placeholder="Idade"
          value={idade}
          onChangeText={setIdade}
          keyboardType="numeric"
          style={styles.input}
        />

        {/* Gênero */}
        <TextInput
          placeholder="Gênero (Masculino, Feminino, Outro)"
          value={genero}
          onChangeText={setGenero}
          style={styles.input}
        />

        {/* Observações */}
        <TextInput
          placeholder="Observações (condições, cuidados, anotações...)"
          value={observacoes}
          onChangeText={setObservacoes}
          multiline
          numberOfLines={4}
          style={[styles.input, styles.textArea]}
        />

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: cores.primary }]}
          onPress={cadastrar}
        >
          <Text style={styles.btnText}>Salvar Paciente</Text>
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
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  btn: {
    backgroundColor: coresPadrao.primary,
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
