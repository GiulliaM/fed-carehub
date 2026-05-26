import React from "react";
import { Text as RNText, TextProps, StyleSheet } from "react-native";

const weightToFont: Record<string, string> = {
  "100": "Poppins_400Regular",
  "200": "Poppins_400Regular",
  "300": "Poppins_400Regular",
  "400": "Poppins_400Regular",
  normal: "Poppins_400Regular",
  "500": "Poppins_500Medium",
  "600": "Poppins_600SemiBold",
  "700": "Poppins_700Bold",
  bold: "Poppins_700Bold",
  "800": "Poppins_800ExtraBold",
  "900": "Poppins_800ExtraBold",
};

export function Text({ style, ...props }: TextProps) {
  const flat = (StyleSheet.flatten(style) as any) || {};
  if (flat.fontFamily) return <RNText style={style} {...props} />;
  const fontFamily = weightToFont[String(flat.fontWeight || "400")] ?? "Poppins_400Regular";
  return <RNText style={[{ fontFamily }, style]} {...props} />;
}

export default Text;
