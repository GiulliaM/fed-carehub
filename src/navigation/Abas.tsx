import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  MaterialCommunityIcons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTema } from "../context/ThemeContext";

import Home from "../screens/Home";
import Tarefas from "../screens/Tarefas";
import Medicamentos from "../screens/Medicamentos";
import Diario from "../screens/Diario";
import Perfil from "../screens/Perfil";

const Tab = createBottomTabNavigator();

export default function Abas() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: cores.background }}>
      <Tab.Navigator
        id="BottomTabs"
        screenOptions={({ route }: { route: { name: string } }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: cores.primary,
          tabBarInactiveTintColor: cores.muted,
          tabBarStyle: {
            backgroundColor: cores.tabBar,
            borderTopWidth: 1,
            borderTopColor: cores.tabBarBorder,
            elevation: 10,
            height: 60 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
          },
          tabBarIcon: ({
            color,
            size,
          }: {
            color: string;
            size: number;
          }) => {
            switch (route.name) {
              case "Home":
                return <Feather name="home" color={color} size={size} />;
              case "Tarefas":
                return (
                  <MaterialCommunityIcons
                    name="calendar-check"
                    color={color}
                    size={size}
                  />
                );
              case "Medicamentos":
                return (
                  <FontAwesome5 name="pills" color={color} size={size} />
                );
              case "Diario":
                return <Feather name="book" color={color} size={size} />;
              case "Perfil":
                return <Feather name="user" color={color} size={size} />;
              default:
                return null;
            }
          },
        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Tarefas" component={Tarefas} />
        <Tab.Screen
          name="Medicamentos"
          component={Medicamentos}
          listeners={({ navigation }) => ({
            tabPress: () => {
              navigation.navigate("Medicamentos", { resetToToday: Date.now() });
            },
          })}
        />
        <Tab.Screen name="Diario" component={Diario} />
        <Tab.Screen name="Perfil" component={Perfil} />
      </Tab.Navigator>
    </View>
  );
}
