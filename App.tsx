import { LogBox, View, ActivityIndicator } from "react-native";
LogBox.ignoreLogs(["Require cycle:"]);

import React from "react";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import NavegadorRaiz from "./src/navigation/NavegadorRaiz";
import { ProvedorTema } from "./src/context/ThemeContext";
import { ToastProvider } from "./src/context/ToastContext";

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ProvedorTema>
      <ToastProvider>
        <NavegadorRaiz />
      </ToastProvider>
    </ProvedorTema>
  );
}
