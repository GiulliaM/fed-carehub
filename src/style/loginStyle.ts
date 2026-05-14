import { StyleSheet } from "react-native";

export default StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  link: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 8,
    letterSpacing: 1,
  },
});
