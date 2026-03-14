
// App principal do CareHub, onde tudo começa (tipo o chefão do game)
import { LogBox } from "react-native";
LogBox.ignoreLogs(["Require cycle:"]);

import React from "react";
import * as Notifications from "expo-notifications";
import NavegadorRaiz from "./src/navigation/NavegadorRaiz";
import { ProvedorTema } from "./src/context/ThemeContext";

// Configura como as notificações são exibidas quando o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  return (
    <ProvedorTema>
      <NavegadorRaiz />
    </ProvedorTema>
  );
}