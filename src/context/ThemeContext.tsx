
// Contexto de tema pra deixar o app bonitinho, ou pelo menos tentar
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type NomeTema = "light" | "dark";
type TamanhoFonte = "small" | "medium" | "large";

const ESCALAS_FONTE: Record<TamanhoFonte, number> = {
  small: 0.85,
  medium: 1,
  large: 1.2,
};

const CLARO = {
  primary: "#0B3B5A",
  accent: "#D4AF37",
  background: "#F7F8FA",
  text: "#111827",
  muted: "#6B7280",
  card: "#FFFFFF",
  border: "#E2E5EA",
  success: "#22C55E",
  danger: "#EF4444",
  warning: "#F59E0B",
  inputBg: "#FFFFFF",
  inputText: "#111827",
  inputPlaceholder: "#9CA3AF",
  tabBar: "#FFFFFF",
  tabBarBorder: "#E5E7EB",
  statusBar: "dark-content" as const,
};

const ESCURO = {
  primary: "#60A5FA",
  accent: "#FFD36E",
  background: "#0F172A",
  text: "#E2E8F0",
  muted: "#94A3B8",
  card: "#1E293B",
  border: "#334155",
  success: "#4ADE80",
  danger: "#F87171",
  warning: "#FBBF24",
  inputBg: "#1E293B",
  inputText: "#E2E8F0",
  inputPlaceholder: "#64748B",
  tabBar: "#1E293B",
  tabBarBorder: "#334155",
  statusBar: "light-content" as const,
};

export type Tema = typeof CLARO;

type ValorContextoTema = {
  nomeTema: NomeTema;
  cores: Tema;
  tamanhoFonte: TamanhoFonte;
  escalaFonte: number;
  alternarTema: () => Promise<void>;
  definirNomeTema: (t: NomeTema) => Promise<void>;
  definirTamanhoFonte: (s: TamanhoFonte) => Promise<void>;
  tf: (base: number) => number;
};

const ContextoTema = createContext<ValorContextoTema | undefined>(undefined);

const CHAVE_TEMA = "app_theme";
const CHAVE_FONTE = "app_font_size";

export const ProvedorTema: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [nomeTema, definirNomeTemaEstado] = useState<NomeTema>("light");
  const [tamanhoFonte, definirTamanhoFonteEstado] = useState<TamanhoFonte>("medium");

  useEffect(() => {
    (async () => {
      try {
        const [temaRaw, fonteRaw] = await Promise.all([
          AsyncStorage.getItem(CHAVE_TEMA),
          AsyncStorage.getItem(CHAVE_FONTE),
        ]);
        if (temaRaw === "dark" || temaRaw === "light")
          definirNomeTemaEstado(temaRaw);
        if (fonteRaw === "small" || fonteRaw === "medium" || fonteRaw === "large")
          definirTamanhoFonteEstado(fonteRaw);
      } catch {}
    })();
  }, []);

  const definirNomeTema = async (t: NomeTema) => {
    try {
      await AsyncStorage.setItem(CHAVE_TEMA, t);
    } catch {}
    definirNomeTemaEstado(t);
  };

  const definirTamanhoFonte = async (s: TamanhoFonte) => {
    try {
      await AsyncStorage.setItem(CHAVE_FONTE, s);
    } catch {}
    definirTamanhoFonteEstado(s);
  };

  const alternarTema = async () => {
    await definirNomeTema(nomeTema === "light" ? "dark" : "light");
  };

  const cores = nomeTema === "light" ? CLARO : ESCURO;
  const escalaFonte = ESCALAS_FONTE[tamanhoFonte];

  const tf = (base: number) => Math.round(base * escalaFonte);

  return (
    <ContextoTema.Provider
      value={{
        nomeTema,
        cores,
        tamanhoFonte,
        escalaFonte,
        alternarTema,
        definirNomeTema,
        definirTamanhoFonte,
        tf,
      }}
    >
      {children}
    </ContextoTema.Provider>
  );
};

export function useTema() {
  const ctx = useContext(ContextoTema);
  if (!ctx) throw new Error("useTema deve ser usado dentro de ProvedorTema");
  return ctx;
}

export default ContextoTema;
