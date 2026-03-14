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
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EditarPaciente({ route, navigation }: any) {
  const { cores } = useTema();
  const [paciente, setPaciente] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  // Campos editáveis
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [genero, setGenero] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const pacienteParam = route.params?.paciente;

  useEffect(() => {
    if (pacienteParam) {
      setPaciente(pacienteParam);
      setNome(pacienteParam.nome || "");
      setIdade(pacienteParam.idade ? pacienteParam.idade.toString() : "");
      setGenero(pacienteParam.genero || "");
      setObservacoes(pacienteParam.observacoes || "");
      setCarregando(false);
    } else {
      carregarPaciente();
    }
  }, []);

  const carregarPaciente = async () => {
    try {
      const token = await obterToken();
      const res = await fetch(`${API_URL}/pacientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (res.ok && json.length > 0) {
        const p = json[0];
        setPaciente(p);
        setNome(p.nome);
        setIdade(p.idade ? p.idade.toString() : "");
        setGenero(p.genero || "");
        setObservacoes(p.observacoes || "");
      }
    } catch (error) {
      console.error("Erro ao carregar paciente:", error);
      Alert.alert("Erro", "Falha ao carregar dados do paciente.");
    } finally {
      setCarregando(false);
    }
  };

  const salvarAlteracoes = async () => {
    if (!paciente || !paciente.paciente_id) {
      return Alert.alert("Erro", "Paciente inválido.");
    }

    try {
      const token = await obterToken();
      const res = await fetch(`${API_URL}/pacientes/${paciente.paciente_id}`, {
        method: "PATCH",
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
        return Alert.alert("Erro", json.message || "Erro ao atualizar paciente.");
      }

      // Atualizar AsyncStorage com paciente atualizado
      await AsyncStorage.setItem(
        "paciente",
        JSON.stringify({
          ...paciente,
          nome,
          idade,
          genero,
          observacoes,
        })
      );

      Alert.alert("Sucesso", "Informações atualizadas com sucesso!");
      navigation.goBack();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      Alert.alert("Erro", "Falha ao conectar com o servidor.");
    }
  };

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
          Editar Informações do Paciente
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
          placeholder="Observações"
          value={observacoes}
          onChangeText={setObservacoes}
          multiline
          numberOfLines={4}
          style={[styles.input, styles.textArea]}
        />

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: cores.primary }]}
          onPress={salvarAlteracoes}
        >
          <Text style={styles.btnText}>Salvar Alterações</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSecundario]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnSecText}>Cancelar</Text>
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
