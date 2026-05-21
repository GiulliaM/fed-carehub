import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTema } from "../context/ThemeContext";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
  onHide: () => void;
  duration?: number;
}

const TYPE_CONFIG: Record<ToastType, { icon: React.ComponentProps<typeof Ionicons>["name"]; color: string }> = {
  success: { icon: "checkmark-circle", color: "#22C55E" },
  error:   { icon: "close-circle",     color: "#EF4444" },
  warning: { icon: "warning",          color: "#F59E0B" },
  info:    { icon: "information-circle", color: "#60A5FA" },
};

export default function Toast({ visible, message, type, onHide, duration = 3000 }: ToastProps) {
  const { cores } = useTema();
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current);

      Animated.parallel([
        Animated.timing(translateY, { toValue: 0,  duration: 250, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 1,  duration: 250, useNativeDriver: true }),
      ]).start();

      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: 80, duration: 220, useNativeDriver: true }),
          Animated.timing(opacity,    { toValue: 0,  duration: 220, useNativeDriver: true }),
        ]).start(() => onHide());
      }, duration);
    } else {
      translateY.setValue(80);
      opacity.setValue(0);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  const { icon, color } = TYPE_CONFIG[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: cores.card, borderColor: color, opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <Ionicons name={icon} size={22} color={color} style={styles.icon} />
      <Text style={[styles.message, { color: cores.text }]} numberOfLines={3}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 9999,
  },
  icon: { marginRight: 12 },
  message: { flex: 1, fontSize: 14, fontWeight: "500", lineHeight: 20 },
});
