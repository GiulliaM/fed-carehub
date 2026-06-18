import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { Text } from "../components/Text";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTema } from "../context/ThemeContext";
import api from "../config/api";
import { obterERegistrarPushToken, configurarCanal } from "../utils/notificacoes";

const STEPS = [
  { id: 1, label: "Auth", icon: "shield-checkmark-outline" as const },
  { id: 2, label: "Paciente", icon: "person-outline" as const },
  { id: 3, label: "Dados", icon: "sync-outline" as const },
  { id: 4, label: "Pronto", icon: "checkmark-circle-outline" as const },
];

export default function CarregandoDados({ navigation }: any) {
  const { cores } = useTema();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Iniciando...");
  const [currentStep, setCurrentStep] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.14,
          duration: 750,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setMessage("Verificando autenticação...");
      setProgress(0.2);
      setCurrentStep(1);
      await delay(350);

      const rawUser = await AsyncStorage.getItem("usuario");
      if (!rawUser) {
        navigation.reset({ index: 0, routes: [{ name: "BoasVindas" }] });
        return;
      }
      const meta = JSON.parse(rawUser);
      try {
        const res = await api.get(`/usuarios/perfil/${meta.usuario_id}`);
        if (res.data?.usuario_id) {
          const atualizado = { ...meta, ...res.data };
          await AsyncStorage.setItem("usuario", JSON.stringify(atualizado));
        }
      } catch {}

      setMessage("Carregando dados do paciente...");
      setProgress(0.5);
      setCurrentStep(2);
      await delay(300);

      let paciente = null;
      try {
        const res = await api.get("/pacientes");
        if (Array.isArray(res.data) && res.data.length > 0) {
          paciente = res.data[0];
          await AsyncStorage.setItem("paciente", JSON.stringify(paciente));
        }
      } catch {}

      setMessage("Sincronizando tarefas e medicamentos...");
      setProgress(0.8);
      setCurrentStep(3);
      await delay(300);

      if (paciente?.paciente_id) {
        try {
          await Promise.all([
            api.get(`/tarefas?paciente_id=${paciente.paciente_id}`),
            api.get(`/medicamentos/${paciente.paciente_id}`),
          ]);
        } catch {}
      }

      setMessage("Tudo pronto!");
      setProgress(1);
      setCurrentStep(4);
      await delay(600);

      await obterERegistrarPushToken();
      await configurarCanal();

      // cuidador so acessa as abas se o perfil estiver aprovado pelo admin
      if (meta.tipo === "cuidador") {
        try {
          const perfilRes = await api.get("/cuidador/perfil");
          if (perfilRes.data?.status !== "aprovado") {
            navigation.reset({ index: 0, routes: [{ name: "CuidadorEmAnalise" }] });
            return;
          }
        } catch {
          navigation.reset({ index: 0, routes: [{ name: "CuidadorEmAnalise" }] });
          return;
        }
      }

      navigation.reset({ index: 0, routes: [{ name: "Abas" }] });
    } catch {
      setMessage("Erro ao carregar. Tente novamente.");
      await delay(2000);
      navigation.reset({ index: 0, routes: [{ name: "BoasVindas" }] });
    }
  }

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

        {/* Heart logo */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 20 }}>
          <View style={[styles.heartBg, { backgroundColor: cores.primary + "1A" }]}>
            <Ionicons name="heart" size={68} color={cores.primary} />
          </View>
        </Animated.View>

        {/* App name */}
        <Text style={[styles.appName, { color: cores.primary }]}>CareHub</Text>
        <Text style={[styles.tagline, { color: cores.muted }]}>
          Cuidando de quem você ama
        </Text>

        {/* Step indicators */}
        <View style={styles.stepsRow}>
          {STEPS.map((step, i) => {
            const done = currentStep > step.id;
            const active = currentStep === step.id;
            return (
              <View key={step.id} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    { borderColor: done || active ? cores.primary : cores.border },
                    (done || active) && { backgroundColor: cores.primary },
                  ]}
                >
                  <Ionicons
                    name={done ? "checkmark" : step.icon}
                    size={13}
                    color={done || active ? "#fff" : cores.muted}
                  />
                </View>
                {i < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      { backgroundColor: done ? cores.primary : cores.border },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Status message */}
        <Text style={[styles.message, { color: cores.text }]}>{message}</Text>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: cores.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: cores.primary,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        <Text style={[styles.percent, { color: cores.primary }]}>
          {Math.round(progress * 100)}%
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  heartBg: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    marginBottom: 36,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  stepItem: { flexDirection: "row", alignItems: "center" },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: { width: 28, height: 2, marginHorizontal: 4 },
  message: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 20,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: { height: "100%", borderRadius: 3 },
  percent: { fontSize: 20, fontWeight: "700" },
});
