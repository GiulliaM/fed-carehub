// Tela de bloqueio do cuidador que ainda nao foi aprovado pelo admin.
// Mostra o status (em analise / rejeitado / completar perfil) e nao da acesso as abas.
import React, { useCallback, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Text } from "../components/Text";
import { AnimatedPressable as TouchableOpacity } from "../components/AnimatedPressable";
import { useTema } from "../context/ThemeContext";
import api from "../config/api";
import { sair } from "../utils/autenticacao";

type Estado = "carregando" | "pendente" | "rejeitado" | "incompleto";

export default function CuidadorEmAnalise({ navigation }: any) {
  const { cores } = useTema();
  const [estado, setEstado] = useState<Estado>("carregando");
  const [motivo, setMotivo] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);

  const checar = useCallback(async () => {
    try {
      const res = await api.get("/cuidador/perfil");
      const perfil = res.data;
      if (!perfil) {
        setEstado("incompleto");
      } else if (perfil.status === "aprovado") {
        // aprovado no meio do caminho: libera o app
        navigation.reset({ index: 0, routes: [{ name: "Abas" }] });
        return;
      } else if (perfil.status === "rejeitado") {
        setMotivo(perfil.motivo_rejeicao || null);
        setEstado("rejeitado");
      } else {
        setEstado("pendente");
      }
    } catch {
      setEstado("pendente");
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      setEstado("carregando");
      checar();
    }, [checar])
  );

  const atualizar = async () => {
    setVerificando(true);
    await checar();
    setVerificando(false);
  };

  const fazerLogout = async () => {
    await sair();
    navigation.reset({ index: 0, routes: [{ name: "BoasVindas" }] });
  };

  const conteudo = {
    carregando: null,
    incompleto: {
      icone: "person-add-outline" as const,
      cor: cores.primary,
      titulo: "Complete seu perfil",
      texto:
        "Para começar a atender, preencha seus dados de cuidador. Depois eles passam por uma análise da nossa equipe.",
      botao: "Completar perfil",
    },
    pendente: {
      icone: "time-outline" as const,
      cor: cores.warning,
      titulo: "Perfil em análise",
      texto:
        "Recebemos seus dados! Nossa equipe está verificando suas informações. Você terá acesso assim que o perfil for aprovado.",
      botao: "Revisar meu perfil",
    },
    rejeitado: {
      icone: "close-circle-outline" as const,
      cor: cores.danger,
      titulo: "Perfil não aprovado",
      texto:
        "Seu perfil não passou na análise. Ajuste os dados indicados abaixo e reenvie para uma nova verificação.",
      botao: "Corrigir e reenviar",
    },
  }[estado];

  if (estado === "carregando" || !conteudo) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={cores.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: cores.background }]}>
      <View style={styles.center}>
        <View style={[styles.iconeBox, { backgroundColor: conteudo.cor + "1A" }]}>
          <Ionicons name={conteudo.icone} size={64} color={conteudo.cor} />
        </View>

        <Text style={[styles.titulo, { color: cores.text }]}>{conteudo.titulo}</Text>
        <Text style={[styles.texto, { color: cores.muted }]}>{conteudo.texto}</Text>

        {estado === "rejeitado" && motivo ? (
          <View style={[styles.motivoBox, { backgroundColor: cores.danger + "15", borderColor: cores.danger }]}>
            <Text style={[styles.motivoLabel, { color: cores.danger }]}>Motivo</Text>
            <Text style={[styles.motivoTexto, { color: cores.text }]}>{motivo}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.rodape}>
        <TouchableOpacity
          style={[styles.btnPrincipal, { backgroundColor: cores.primary }]}
          onPress={() => navigation.navigate("PerfilCuidador")}
        >
          <Feather name="edit-3" size={18} color="#fff" />
          <Text style={styles.btnPrincipalTxt}>{conteudo.botao}</Text>
        </TouchableOpacity>

        {estado === "pendente" && (
          <TouchableOpacity style={styles.btnSecundario} onPress={atualizar} disabled={verificando}>
            {verificando ? (
              <ActivityIndicator color={cores.primary} />
            ) : (
              <Text style={[styles.btnSecundarioTxt, { color: cores.primary }]}>
                Já fui aprovado? Atualizar
              </Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.btnSair} onPress={fazerLogout}>
          <Feather name="log-out" size={16} color={cores.muted} />
          <Text style={[styles.btnSairTxt, { color: cores.muted }]}>Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  iconeBox: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  titulo: { fontSize: 23, fontWeight: "800", textAlign: "center", marginBottom: 12 },
  texto: { fontSize: 15, lineHeight: 23, textAlign: "center" },
  motivoBox: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 24,
  },
  motivoLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  motivoTexto: { fontSize: 14, lineHeight: 20 },
  rodape: { paddingHorizontal: 24, paddingBottom: 24 },
  btnPrincipal: {
    flexDirection: "row",
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnPrincipalTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnSecundario: { height: 46, alignItems: "center", justifyContent: "center", marginTop: 6 },
  btnSecundarioTxt: { fontSize: 14, fontWeight: "600" },
  btnSair: {
    flexDirection: "row",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 2,
  },
  btnSairTxt: { fontSize: 14, fontWeight: "600" },
});
