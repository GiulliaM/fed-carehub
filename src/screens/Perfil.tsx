import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTema } from "../context/ThemeContext";
import { sair, obterDadosUsuario } from "../utils/autenticacao";
import { termoPaciente } from "../utils/terminologia";
import api from "../utils/clienteApi";

export default function Perfil({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const { cores, nomeTema, definirNomeTema, tamanhoFonte, definirTamanhoFonte, tf } =
    useTema();

  const termo = termoPaciente(user?.tipo);

  const fetchProfile = useCallback(async () => {
    try {
      setCarregando(true);
      const meta = await obterDadosUsuario();

      if (!meta || !meta.usuario_id) {
        Alert.alert("Sessao Expirada", "Por favor, faca login novamente.");
        await sair();
        return navigation.reset({ index: 0, routes: [{ name: "BoasVindas" }] });
      }

      setUser(meta);

      try {
        const res = await api.get(`/usuarios/perfil/${meta.usuario_id}`);
        if (res && res.nome) {
          const userData = {
            usuario_id: res.usuario_id,
            nome: res.nome,
            email: res.email,
            tipo: res.tipo,
            telefone: res.telefone || "",
            foto_url: res.foto_url || "",
          };
          setUser(userData);
          await AsyncStorage.setItem("usuario", JSON.stringify(userData));
        }
      } catch {}

      try {
        const pacienteRes = await api.get("/pacientes");
        const lista = Array.isArray(pacienteRes) ? pacienteRes : [];
        setPacientes(lista);
      } catch {
        setPacientes([]);
      }
    } catch {
      Alert.alert(
        "Erro",
        "Nao foi possivel carregar as informacoes. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  async function handleLogout() {
    await sair();
    navigation.reset({ index: 0, routes: [{ name: "BoasVindas" }] });
  }

  const fontOptions = [
    { key: "small" as const, label: "A", size: 13 },
    { key: "medium" as const, label: "A", size: 16 },
    { key: "large" as const, label: "A", size: 20 },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: cores.background }]}
    >
      {carregando ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={cores.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text
            style={[
              styles.title,
              { color: cores.primary, fontSize: tf(26) },
            ]}
          >
            Meu Perfil
          </Text>

          {/* Foto + Info do usuario */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: cores.card,
                borderColor: cores.border,
                alignItems: "center",
              },
            ]}
          >
            <TouchableOpacity style={styles.avatarContainer}>
              {user?.foto_url ? (
                <Image
                  source={{ uri: user.foto_url }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: cores.border },
                  ]}
                >
                  <Ionicons
                    name="camera-outline"
                    size={32}
                    color={cores.muted}
                  />
                </View>
              )}
              <View
                style={[
                  styles.avatarBadge,
                  { backgroundColor: cores.primary },
                ]}
              >
                <Ionicons name="pencil" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            <Text
              style={[
                styles.userName,
                { color: cores.text, fontSize: tf(20) },
              ]}
            >
              {user?.nome || "Usuario"}
            </Text>
            <Text
              style={[
                styles.userEmail,
                { color: cores.muted, fontSize: tf(14) },
              ]}
            >
              {user?.email}
            </Text>
            {user?.telefone ? (
              <Text
                style={[
                  styles.userEmail,
                  { color: cores.muted, fontSize: tf(13) },
                ]}
              >
                {user.telefone}
              </Text>
            ) : null}
            <Text
              style={[
                styles.userType,
                { color: cores.primary, fontSize: tf(12) },
              ]}
            >
              {user?.tipo === "cuidador" ? "Cuidador(a)" : "Familiar"}
            </Text>

            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: cores.primary }]}
              onPress={() => navigation.navigate("EditarUsuario", { user })}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.editBtnText}>Editar perfil</Text>
            </TouchableOpacity>
          </View>

          {/* Pacientes vinculados */}
          <View
            style={[
              styles.card,
              { backgroundColor: cores.card, borderColor: cores.border },
            ]}
          >
            <View style={styles.headerCard}>
              <Ionicons
                name="heart-outline"
                size={22}
                color={cores.primary}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: cores.text, fontSize: tf(17) },
                ]}
              >
                {pacientes.length > 1
                  ? `Meus ${termo}s`
                  : `Meu ${termo}`}
              </Text>
            </View>

            {pacientes.length === 0 ? (
              <Text
                style={[
                  styles.infoText,
                  { color: cores.muted, fontSize: tf(14) },
                ]}
              >
                Nenhum {termo.toLowerCase()} vinculado.
              </Text>
            ) : (
              pacientes.map((p: any) => (
                <View
                  key={p.paciente_id}
                  style={[
                    styles.pacienteItem,
                    { borderBottomColor: cores.border },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        { color: cores.text, fontWeight: "600", fontSize: tf(15) },
                      ]}
                    >
                      {p.nome}
                    </Text>
                    <Text
                      style={[
                        { color: cores.muted, fontSize: tf(12) },
                      ]}
                    >
                      Idade: {p.idade || "N/I"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("EditarPaciente", { paciente: p })
                    }
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={cores.muted}
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}

            <View style={styles.pacienteActions}>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: cores.primary }]}
                onPress={() => navigation.navigate("CadastrarPaciente")}
              >
                <Ionicons name="add-outline" size={16} color="#fff" />
                <Text style={styles.smallBtnText}>Cadastrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.smallBtn,
                  {
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: cores.primary,
                  },
                ]}
                onPress={() => navigation.navigate("VincularCuidador")}
              >
                <Ionicons
                  name="link-outline"
                  size={16}
                  color={cores.primary}
                />
                <Text
                  style={[styles.smallBtnText, { color: cores.primary }]}
                >
                  Vincular
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Perfil profissional (cuidador) */}
          {user?.tipo === "cuidador" && (
            <TouchableOpacity
              style={[
                styles.menuItem,
                { backgroundColor: cores.card, borderColor: cores.border },
              ]}
              onPress={() => navigation.navigate("PerfilCuidador")}
            >
              <Ionicons
                name="briefcase-outline"
                size={22}
                color={cores.primary}
              />
              <Text
                style={[
                  styles.menuText,
                  { color: cores.text, fontSize: tf(15) },
                ]}
              >
                Perfil profissional
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={cores.muted}
              />
            </TouchableOpacity>
          )}

          {/* Buscar cuidadores (familiar) */}
          {user?.tipo === "familiar" && (
            <TouchableOpacity
              style={[
                styles.menuItem,
                { backgroundColor: cores.card, borderColor: cores.border },
              ]}
              onPress={() => navigation.navigate("BuscaCuidadores")}
            >
              <Ionicons
                name="search-outline"
                size={22}
                color={cores.primary}
              />
              <Text
                style={[
                  styles.menuText,
                  { color: cores.text, fontSize: tf(15) },
                ]}
              >
                Buscar cuidadores
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={cores.muted}
              />
            </TouchableOpacity>
          )}

          {/* Configuracoes */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: cores.card, borderColor: cores.border },
            ]}
            onPress={() => navigation.navigate("Configuracoes")}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={cores.primary}
            />
            <Text
              style={[
                styles.menuText,
                { color: cores.text, fontSize: tf(15) },
              ]}
            >
              Notificacoes e lembretes
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={cores.muted}
            />
          </TouchableOpacity>

          {/* CONFIGURACOES DE APARENCIA */}
          <View
            style={[
              styles.card,
              { backgroundColor: cores.card, borderColor: cores.border },
            ]}
          >
            <View style={styles.headerCard}>
              <Ionicons
                name="color-palette-outline"
                size={22}
                color={cores.primary}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: cores.text, fontSize: tf(17) },
                ]}
              >
                Aparencia
              </Text>
            </View>

            {/* Tema */}
            <View style={styles.settingRow}>
              <Text
                style={[
                  styles.settingLabel,
                  { color: cores.text, fontSize: tf(14) },
                ]}
              >
                Tema
              </Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    nomeTema === "light" && {
                      backgroundColor: cores.primary,
                    },
                    { borderColor: cores.border },
                  ]}
                  onPress={() => definirNomeTema("light")}
                >
                  <Ionicons
                    name="sunny-outline"
                    size={18}
                    color={nomeTema === "light" ? "#fff" : cores.text}
                  />
                  <Text
                    style={{
                      color: nomeTema === "light" ? "#fff" : cores.text,
                      fontSize: tf(13),
                      fontWeight: "600",
                      marginLeft: 4,
                    }}
                  >
                    Claro
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    nomeTema === "dark" && {
                      backgroundColor: cores.primary,
                    },
                    { borderColor: cores.border },
                  ]}
                  onPress={() => definirNomeTema("dark")}
                >
                  <Ionicons
                    name="moon-outline"
                    size={18}
                    color={nomeTema === "dark" ? "#fff" : cores.text}
                  />
                  <Text
                    style={{
                      color: nomeTema === "dark" ? "#fff" : cores.text,
                      fontSize: tf(13),
                      fontWeight: "600",
                      marginLeft: 4,
                    }}
                  >
                    Escuro
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tamanho da fonte */}
            <View style={styles.settingRow}>
              <Text
                style={[
                  styles.settingLabel,
                  { color: cores.text, fontSize: tf(14) },
                ]}
              >
                Tamanho da fonte
              </Text>
              <View style={styles.toggleRow}>
                {fontOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.fontBtn,
                      tamanhoFonte === opt.key && {
                        backgroundColor: cores.primary,
                      },
                      { borderColor: cores.border },
                    ]}
                    onPress={() => definirTamanhoFonte(opt.key)}
                  >
                    <Text
                      style={{
                        fontSize: opt.size,
                        color:
                          tamanhoFonte === opt.key ? "#fff" : cores.text,
                        fontWeight: "700",
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: cores.danger }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontWeight: "700", textAlign: "center", marginBottom: 16 },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    elevation: 2,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontWeight: "700" },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: { fontWeight: "700", marginTop: 4 },
  userEmail: { marginTop: 2 },
  userType: {
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 4,
    letterSpacing: 1,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  editBtnText: { color: "#fff", fontWeight: "600" },
  infoText: { textAlign: "center", marginBottom: 8 },
  pacienteItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  pacienteActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    justifyContent: "center",
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  smallBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 10,
  },
  menuText: { flex: 1, fontWeight: "600" },
  settingRow: { marginTop: 12 },
  settingLabel: { fontWeight: "600", marginBottom: 8 },
  toggleRow: { flexDirection: "row", gap: 8 },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  fontBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
