import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTema } from "../context/ThemeContext";

export default function BoasVindas({ navigation }: any) {
  const { cores, tf } = useTema();

  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(24)).current;
  const textOpacity    = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(16)).current;
  const btnsOpacity    = useRef(new Animated.Value(0)).current;
  const btnsTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity,    { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(logoTranslateY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity,    { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(textTranslateY, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnsOpacity,    { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(btnsTranslateY, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.background }]}>
      <Animated.View
        style={[
          styles.container,
          { opacity: logoOpacity, transform: [{ translateY: logoTranslateY }] },
        ]}
      >
        <Image
          source={require("../assets/logo_carehub.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.textArea,
          { opacity: textOpacity, transform: [{ translateY: textTranslateY }] },
        ]}
      >
        <Text style={[styles.title, { color: cores.primary, fontSize: tf(32) }]}>CareHub</Text>
        <Text style={[styles.subtitle, { color: cores.muted, fontSize: tf(16) }]}>
          Cuidando de quem você ama 💙
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.btnsArea,
          { opacity: btnsOpacity, transform: [{ translateY: btnsTranslateY }] },
        ]}
      >
        <TouchableOpacity
          style={[styles.button, { backgroundColor: cores.primary }]}
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonText, { fontSize: tf(16) }]}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Cadastro")} activeOpacity={0.7}>
          <Text style={[styles.link, { color: cores.primary, fontSize: tf(14) }]}>
            Ainda não tem conta? Cadastre-se
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  container: { alignItems: "center", marginBottom: 4 },
  logo:      { width: 120, height: 120, marginBottom: 12 },
  textArea:  { alignItems: "center", marginBottom: 28 },
  title:     { fontWeight: "800" },
  subtitle:  { marginTop: 4 },
  btnsArea:  { width: "100%", alignItems: "center", paddingHorizontal: 16 },
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginBottom: 14,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  link:       { fontWeight: "700" },
});
