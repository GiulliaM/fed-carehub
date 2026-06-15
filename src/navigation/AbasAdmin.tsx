import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTema } from "../context/ThemeContext";

import AdminDashboard from "../screens/admin/AdminDashboard";
import AdminListaCuidadores from "../screens/admin/AdminListaCuidadores";
import AdminListaUsuarios from "../screens/admin/AdminListaUsuarios";

const Tab = createBottomTabNavigator();

export default function AbasAdmin() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: cores.background }}>
      <Tab.Navigator
        id="AdminTabs"
        screenOptions={({ route }: { route: { name: string } }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: cores.primary,
          tabBarInactiveTintColor: cores.muted,
          tabBarLabelStyle: { fontSize: 11, fontFamily: "Poppins_500Medium" },
          tabBarStyle: {
            backgroundColor: cores.tabBar,
            borderTopWidth: 1,
            borderTopColor: cores.border,
            elevation: 10,
            height: 60 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
          },
          tabBarIcon: ({ color, size }: { color: string; size: number }) => {
            switch (route.name) {
              case "Dashboard":
                return <Feather name="grid" color={color} size={size} />;
              case "Cuidadores":
                return <Feather name="user-check" color={color} size={size} />;
              case "Usuarios":
                return <Feather name="users" color={color} size={size} />;
              default:
                return null;
            }
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={AdminDashboard} options={{ tabBarLabel: "Dashboard" }} />
        <Tab.Screen name="Cuidadores" component={AdminListaCuidadores} options={{ tabBarLabel: "Cuidadores" }} />
        <Tab.Screen name="Usuarios" component={AdminListaUsuarios} options={{ tabBarLabel: "Usuários" }} />
      </Tab.Navigator>
    </View>
  );
}
