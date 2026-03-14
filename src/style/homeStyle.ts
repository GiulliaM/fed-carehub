import { StyleSheet } from "react-native";

export default StyleSheet.create({

  safeArea: {
    flex: 1,
  },

  container: {
    padding: 16,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },

  welcome: {
    fontSize: 26,
    fontWeight: "700",
  },

  welcomeSubtitle: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
  },

  /* CARD BASE */
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 26,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  cardLabel: {
    fontWeight: "700",
  },

  cardInfo: {
    fontSize: 15,
    marginBottom: 6,
  },

  patientActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },

  editBtn: {
    flexDirection: "row",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  editText: {
    color: "#fff",
    fontWeight: "700",
  },

  emptyText: {
    textAlign: "center",
    opacity: 0.7,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },

  quickGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 26,
  },

  quickCard: {
    width: "31%",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 3,
  },

  quickText: {
    marginTop: 8,
    fontWeight: "600",
  },
  notice: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  noticeText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
