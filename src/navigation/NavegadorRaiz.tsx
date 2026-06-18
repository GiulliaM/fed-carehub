
// Navegador raiz do app, tipo o GPS que leva pra cada tela
import React, { useEffect, useRef, useState } from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { View, Animated, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BoasVindas from "../screens/BoasVindas";
import Login from "../screens/Login";
import Cadastro from "../screens/Cadastro";
import CarregandoDados from "../screens/CarregandoDados";
import Abas from "./Abas";
import AbasAdmin from "./AbasAdmin";
import AdminDetalhesCuidador from "../screens/admin/AdminDetalhesCuidador";
import CadastrarPaciente from "../screens/CadastrarPaciente";
import NovaTarefa from "../screens/NovaTarefa";
import NovaMedicamento from "../screens/NovaMedicamento";
import NovoRegistro from "../screens/NovoRegistro";
import EditarUsuario from "../screens/EditarUsuario";
import EditarPaciente from "../screens/EditarPaciente";
import EditMedicamento from "../screens/EditMedicamento";
import DetalhesMedicamento from "../screens/DetalhesMedicamento";
import EditTarefa from "../screens/EditTarefa";
import PerfilCuidador from "../screens/PerfilCuidador";
import BuscaCuidadores from "../screens/BuscaCuidadores";
import HistoricoMedico from "../screens/HistoricoMedico";
import VincularCuidador from "../screens/VincularCuidador";
import MeusPacientes from "../screens/MeusPacientes";
import Configuracoes from "../screens/Configuracoes";
import Artigo from "../screens/Artigo";
import Dicas from "../screens/Dicas";
import DetalhePaciente from "../screens/DetalhePaciente";
import Onboarding from "../screens/Onboarding";
import CuidadorEmAnalise from "../screens/CuidadorEmAnalise";
import { obterToken, obterDadosUsuario } from "../utils/autenticacao";

const Stack = createNativeStackNavigator();
export const referenciaNavegacao = createNavigationContainerRef();

export default function NavegadorRaiz() {
  const [verificando, setVerificando] = useState(true);
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const token = await obterToken();
      if (token) {
        const usuario = await obterDadosUsuario();
        const destino = usuario?.tipo === "admin" ? "AbasAdmin" : "CarregandoDados";
        setTimeout(() => {
          if ((referenciaNavegacao as any).resetRoot) {
            try {
              (referenciaNavegacao as any).resetRoot({ index: 0, routes: [{ name: destino }] });
            } catch (e) {
              (referenciaNavegacao as any).navigate?.(destino);
            }
          } else {
            (referenciaNavegacao as any).navigate?.(destino);
          }
        }, 100);
      }
      Animated.timing(overlayOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
        setVerificando(false)
      );
    })();
  }, []);

  return (
    <NavigationContainer ref={referenciaNavegacao}>
      <Stack.Navigator id="RootStack" initialRouteName="BoasVindas" screenOptions={{ animation: "slide_from_right" }}>
        <Stack.Screen name="BoasVindas" component={BoasVindas} options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Cadastro" component={Cadastro} options={{ headerShown: false }} />
        <Stack.Screen name="CarregandoDados" component={CarregandoDados} options={{ headerShown: false }} />
        <Stack.Screen name="CadastrarPaciente" component={CadastrarPaciente} options={{ headerShown: false }} />
        <Stack.Screen name="Abas" component={Abas} options={{ headerShown: false }} />
        <Stack.Screen name="AbasAdmin" component={AbasAdmin} options={{ headerShown: false }} />
        <Stack.Screen name="AdminDetalhesCuidador" component={AdminDetalhesCuidador} options={{ headerShown: false }} />
        <Stack.Screen name="NovaTarefa" component={NovaTarefa} options={{ headerShown: false }} />
        <Stack.Screen name="NovoRegistro" component={NovoRegistro} options={{ headerShown: false }} />
        <Stack.Screen name="NovaMedicamento" component={NovaMedicamento} options={{ headerShown: false }} />
        <Stack.Screen name="EditarUsuario" component={EditarUsuario} options={{ headerShown: false }} />
        <Stack.Screen name="EditarPaciente" component={EditarPaciente} options={{ headerShown: false }} />
        <Stack.Screen name="EditMedicamento" component={EditMedicamento} options={{ headerShown: false }} />
        <Stack.Screen name="DetalhesMedicamento" component={DetalhesMedicamento} options={{ headerShown: false }} />
        <Stack.Screen name="EditTarefa" component={EditTarefa} options={{ headerShown: false }} />
        <Stack.Screen name="PerfilCuidador" component={PerfilCuidador} options={{ headerShown: false }} />
        <Stack.Screen name="BuscaCuidadores" component={BuscaCuidadores} options={{ headerShown: false }} />
        <Stack.Screen name="HistoricoMedico" component={HistoricoMedico} options={{ headerShown: false }} />
        <Stack.Screen name="VincularCuidador" component={VincularCuidador} options={{ headerShown: false }} />
        <Stack.Screen name="MeusPacientes" component={MeusPacientes} options={{ headerShown: false }} />
        <Stack.Screen name="Configuracoes" component={Configuracoes} options={{ headerShown: false }} />
        <Stack.Screen name="Artigo" component={Artigo} options={{ headerShown: false }} />
        <Stack.Screen name="Dicas" component={Dicas} options={{ headerShown: false }} />
        <Stack.Screen name="DetalhePaciente" component={DetalhePaciente} options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="CuidadorEmAnalise" component={CuidadorEmAnalise} options={{ headerShown: false, animation: "fade", gestureEnabled: false }} />
      </Stack.Navigator>

      {verificando && (
        <Animated.View
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#0B3B5A",
            opacity: overlayOpacity,
          }}
          pointerEvents="none"
        >
          <ActivityIndicator size="large" color="#D4AF37" />
        </Animated.View>
      )}
    </NavigationContainer>
  );
}
