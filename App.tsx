// App principal do CareHub, onde tudo começa (tipo o chefão do game)
import { LogBox } from "react-native";
LogBox.ignoreLogs(["Require cycle:"]);

import React from "react";
// O import pode ficar, ele não machuca ninguém sozinho
//import * as Notifications from "expo-notifications"; 
import NavegadorRaiz from "./src/navigation/NavegadorRaiz";
import { ProvedorTema } from "./src/context/ThemeContext";
import { ToastProvider } from "./src/context/ToastContext";

export default function App() {
  return (
    <ProvedorTema>
      <ToastProvider>
        <NavegadorRaiz />
      </ToastProvider>
    </ProvedorTema>
  );
} 