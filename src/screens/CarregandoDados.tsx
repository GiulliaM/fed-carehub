import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTema } from "../context/ThemeContext";
import api from "../utils/clienteApi";

export default function CarregandoDados({ navigation }: any) {
  const { cores } = useTema();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Carregando seus dados...");
  const [fillAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadAllData();
  }, []);

  // Anima o preenchimento do coração conforme o progresso
  useEffect(() => {
    Animated.timing(fillAnimation, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  async function loadAllData() {
    try {
      setMessage("Verificando autenticacao...");
      setProgress(0.2);
      await new Promise(resolve => setTimeout(resolve, 300));

      const rawUser = await AsyncStorage.getItem("usuario");
      if (!rawUser) {
        console.log("User not found, going back to login");
        navigation.reset({ index: 0, routes: [{ name: "BoasVindas" }] });
        return;
      }

      const userData = JSON.parse(rawUser);
      console.log("User authenticated:", userData.nome);

      setMessage("Carregando dados do paciente...");
      setProgress(0.5);
      await new Promise(resolve => setTimeout(resolve, 300));

      let paciente = null;
      try {
        const pacienteRes = await api.get("/pacientes");
        if (Array.isArray(pacienteRes) && pacienteRes.length > 0) {
          paciente = pacienteRes[0];
          await AsyncStorage.setItem("paciente", JSON.stringify(paciente));
          console.log("Patient loaded:", paciente.nome);
        } else {
          console.log("No patient registered");
        }
      } catch (err) {
        console.log("Error fetching patient:", err);
      }

      if (paciente?.paciente_id) {
        setMessage("Sincronizando tarefas...");
        setProgress(0.75);
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          await api.get(`/tarefas?paciente_id=${paciente.paciente_id}`);
          console.log("Tasks synchronized");
        } catch (err) {
          console.log("Error loading tasks:", err);
        }
      }

      if (paciente?.paciente_id) {
        setMessage("Sincronizando medicamentos...");
        setProgress(0.9);
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          await api.get(`/medicamentos/${paciente.paciente_id}`);
          console.log("Medications synchronized");
        } catch (err) {
          console.log("Error loading medications:", err);
        }
      }

      setMessage("Tudo pronto!");
      setProgress(1);
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log("Loading complete");

      navigation.reset({ index: 0, routes: [{ name: "Abas" }] });

    } catch (error) {
      console.error("❌ Erro crítico ao carregar dados:", error);
      setMessage("Erro ao carregar. Tente novamente.");
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigation.reset({ index: 0, routes: [{ name: "BoasVindas" }] });
    }
  }

  const fillHeight = fillAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]}>
      <View style={styles.content}>
        {/* Coração com preenchimento animado */}
        <View style={styles.heartContainer}>
          {/* Coração de fundo (contorno) */}
          <Ionicons name="heart-outline" size={200} color={cores.primary} style={styles.heartOutline} />
          
          {/* Container para o preenchimento */}
          <View style={styles.fillContainer}>
            <Animated.View style={[styles.fillHeart, { height: fillHeight }]}>
              <Ionicons name="heart" size={200} color={cores.primary} />
            </Animated.View>
          </View>
        </View>

        {/* Mensagem de status */}
        <Text style={[styles.message, { color: cores.text }]}>{message}</Text>

        {/* Barra de progresso */}
        <View style={[styles.progressBarContainer, { backgroundColor: cores.muted }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: cores.primary,
                width: fillAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        {/* Porcentagem */}
        <Text style={[styles.percentage, { color: cores.primary }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  heartContainer: {
    position: "relative",
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  heartOutline: {
    position: "absolute",
  },
  fillContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    height: 200,
  },
  fillHeart: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 30,
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 15,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  percentage: {
    fontSize: 24,
    fontWeight: "700",
  },
});
