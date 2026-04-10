import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import cores from "../config/cores";

export default function BoasVindas({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require("../../bandaid.jpg")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>CareHub</Text>
        <Text style={styles.subtitle}>Cuidando de quem você ama 💙</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Cadastro")}>
          <Text style={styles.link}>
            Ainda não tem conta? Cadastre-se
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: cores.background },
  container: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 120, height: 120, marginBottom: 16 },
  title: {
    fontSize: 32,
    color: cores.primary,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 24,
  },
  button: {
    backgroundColor: cores.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { color: cores.primary, fontWeight: "700" },
});
