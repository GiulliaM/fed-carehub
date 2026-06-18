// Tutorial de boas-vindas: slides que aparecem 1x pro usuario novo
import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  StatusBar,
  ListRenderItemInfo,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Text } from "../components/Text";
import { AnimatedPressable as TouchableOpacity } from "../components/AnimatedPressable";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTema } from "../context/ThemeContext";
import { marcarOnboardingVisto } from "../utils/onboarding";

const { width } = Dimensions.get("window");

type Slide = {
  id: string;
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
};

// usa as mesmas cores/icones das abas pra ficar coerente com o app
const COR_ICONE = "#0B3B5A";

const SLIDES: Slide[] = [
  {
    id: "boas-vindas",
    icone: <Ionicons name="heart" size={64} color={COR_ICONE} />,
    titulo: "Bem-vindo ao CareHub",
    descricao:
      "Cuide de quem você ama com tudo organizado num só lugar: tarefas, medicamentos e registros do dia a dia.",
  },
  {
    id: "tarefas",
    icone: (
      <MaterialCommunityIcons name="calendar-check" size={64} color={COR_ICONE} />
    ),
    titulo: "Organize as tarefas",
    descricao:
      "Crie e acompanhe as tarefas de cuidado e marque o que já foi concluído ao longo do dia.",
  },
  {
    id: "medicamentos",
    icone: <FontAwesome5 name="pills" size={56} color={COR_ICONE} />,
    titulo: "Nunca esqueça os remédios",
    descricao:
      "Cadastre os medicamentos com horários e receba lembretes na hora certa de cada dose.",
  },
  {
    id: "diario",
    icone: <Feather name="book" size={60} color={COR_ICONE} />,
    titulo: "Registre tudo no diário",
    descricao:
      "Anote como foi o dia e acompanhe o histórico para compartilhar com quem também cuida.",
  },
  {
    id: "pronto",
    icone: <Ionicons name="checkmark-circle" size={66} color={COR_ICONE} />,
    titulo: "Tudo pronto!",
    descricao: "Vamos começar a cuidar juntos. É só dar o primeiro passo.",
  },
];

export default function Onboarding({ navigation }: any) {
  const { cores } = useTema();
  const listaRef = useRef<FlatList<Slide>>(null);
  const [indice, setIndice] = useState(0);

  const ehUltimo = indice === SLIDES.length - 1;

  async function finalizar() {
    try {
      const raw = await AsyncStorage.getItem("usuario");
      const usuario = raw ? JSON.parse(raw) : null;
      await marcarOnboardingVisto(usuario?.usuario_id);
    } catch {
      await marcarOnboardingVisto();
    }
    // volta pra onde o usuario estava (Home)
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: "Abas" }] });
    }
  }

  function avancar() {
    if (ehUltimo) {
      finalizar();
      return;
    }
    listaRef.current?.scrollToIndex({ index: indice + 1, animated: true });
  }

  function aoRolar(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const novo = Math.round(e.nativeEvent.contentOffset.x / width);
    if (novo !== indice) setIndice(novo);
  }

  function renderSlide({ item }: ListRenderItemInfo<Slide>) {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={[styles.iconeBox, { backgroundColor: cores.primary + "14" }]}>
          {item.icone}
        </View>
        <Text style={[styles.titulo, { color: cores.text }]}>{item.titulo}</Text>
        <Text style={[styles.descricao, { color: cores.muted }]}>
          {item.descricao}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]}>
      <StatusBar barStyle={cores.statusBar} backgroundColor={cores.background} />

      {/* Botao Pular */}
      <View style={styles.topo}>
        {!ehUltimo && (
          <TouchableOpacity onPress={finalizar} style={styles.pularBtn}>
            <Text style={[styles.pularTxt, { color: cores.muted }]}>Pular</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={listaRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={aoRolar}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      {/* Bolinhas de paginacao */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === indice ? cores.primary : cores.border,
                width: i === indice ? 22 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Botao Proximo / Comecar */}
      <View style={styles.rodape}>
        <TouchableOpacity
          onPress={avancar}
          style={[styles.botao, { backgroundColor: cores.primary }]}
        >
          <Text style={styles.botaoTxt}>{ehUltimo ? "Começar" : "Próximo"}</Text>
          {!ehUltimo && (
            <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 6 }} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topo: {
    height: 44,
    paddingHorizontal: 20,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  pularBtn: { padding: 6 },
  pularTxt: { fontSize: 15, fontWeight: "600" },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  iconeBox: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 14,
  },
  descricao: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  rodape: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  botao: {
    flexDirection: "row",
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
